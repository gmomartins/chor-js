import SpaceTool from 'diagram-js/lib/features/space-tool/SpaceTool';
import inherits from 'inherits';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { filter, forEach, isNumber } from 'min-dash';
import { asTRBL } from 'diagram-js/lib/layout/LayoutUtil';

import { getBBox } from 'diagram-js/lib/util/Elements';

const AXIS_TO_DIMENSION = {
  x: 'width',
  y: 'height'
};

/**
 * Add or remove space by moving and resizing elements. This module overwrites the SpaceTool from DiagramJS.
 * Specifically, we overwrite the calculateAdjustments method to make an exception for participants
 *
 * @param injector {Injector}
 * @param rules {Rules}
 */
export default function ChoreoSpaceTool(injector, rules) {
  injector.invoke(SpaceTool, this);
  this._rules = rules;

}

inherits(ChoreoSpaceTool, SpaceTool);

ChoreoSpaceTool.$inject = [
  'injector',
  'rules'
];

function isConnection(element) {
  return !!element.waypoints;
}

ChoreoSpaceTool.prototype.init = function(event, context) {
  console.log(context);
  const res = SpaceTool.prototype.init.call(this, event, context);
  console.log(context);
  if (context.resizingShapes) {
    context.resizingShapes = context.resizingShapes.filter(s => !is(s, 'bpmn:Message') && !is(s, 'bpmn:Participant'));
  }
  console.log(context);

  return res;
};
/**
 * Get elements to be moved and resized.
 *
 * @param  {Array<djs.model.Shape>} elements
 * @param  {string} axis
 * @param  {number} delta
 * @param  {number} start
 *
 * @return {Object}
 */
ChoreoSpaceTool.prototype.calculateAdjustments = function(elements, axis, delta, start) {
  // This method was mostly copied from DiagramJS v6.6.1
  const rules = this._rules;

  const movingShapes = [];
  const resizingShapes = [];

  elements.forEach(element => {
    if (!element.parent || isConnection(element)) {
      return;
    }

    const shapeStart = element[ axis ];
    const shapeEnd = shapeStart + element[ AXIS_TO_DIMENSION[ axis ] ];

    // shape to be moved
    if ((delta > 0 && shapeStart > start) || (delta < 0 && shapeEnd < start)) {
      return movingShapes.push(element);
    }

    // Shape to be resized. For participants, the rules unfortunately do not differentiate between direct resizing
    // by the user and indirect, e.g., by increasing the width of an activity. However, due to the internal logic
    // of the SpaceTool if we want to resize a shape all its children need to be resizable, too. Thus we have to add
    // participants to the resizingShapes list manually here and filter them out later in ChoreoModeling#createSpace
    if (shapeStart < start &&
      shapeEnd > start &&
      (rules.allowed('shape.resize', { shape: element }) || is(element, 'bpmn:Participant'))
    ) {
      if (is(element, 'bpmn:Participant')) {
        resizingShapes.push(...element.children);
        if (axis === 'x') {
          return resizingShapes.push(element);
        } else {
          // if we move in the y direction the band has to be moved
          return movingShapes.push(element);
        }
      }
      return resizingShapes.push(element);
    }
  });

  return {
    movingShapes: movingShapes,
    resizingShapes: resizingShapes
  };
};


// Copied from Diagram-js v6.6.1, getSpaceToolConstraints is not exposed via the prototype. It needs to be changed as it gets confused
// with the participant bands



var DIRECTION_TO_TRBL = {
  n: 'top',
  w: 'left',
  s: 'bottom',
  e: 'right'
};


var DIRECTION_TO_OPPOSITE = {
  n: 's',
  w: 'e',
  s: 'n',
  e: 'w'
};

var PADDING = 20;

function addPadding(trbl) {
  return {
    top: trbl.top - PADDING,
    right: trbl.right + PADDING,
    bottom: trbl.bottom + PADDING,
    left: trbl.left - PADDING
  };
}

function getSpaceToolConstraints(elements, axis, direction, start, minDimensions) {
  var movingShapes = elements.movingShapes,
    resizingShapes = elements.resizingShapes;

  if (!resizingShapes.length) {
    return;
  }

  var spaceToolConstraints = {},
    min,
    max;

  forEach(resizingShapes, function(resizingShape) {
    var resizingShapeBBox = asTRBL(resizingShape);

    // find children that are not moving or resizing
    var nonMovingResizingChildren = filter(resizingShape.children, function(child) {
      return !isConnection(child) &&
        !isLabel(child) &&
        !includes(movingShapes, child) &&
        !includes(resizingShapes, child);
    });

    // find children that are moving
    var movingChildren = filter(resizingShape.children, function(child) {
      return !isConnection(child) && !isLabel(child) && includes(movingShapes, child);
    });

    var minOrMax,
      nonMovingResizingChildrenBBox,
      movingChildrenBBox;

    if (nonMovingResizingChildren.length) {
      nonMovingResizingChildrenBBox = addPadding(asTRBL(getBBox(nonMovingResizingChildren)));

      minOrMax = start -
        resizingShapeBBox[ DIRECTION_TO_TRBL[ direction ] ] +
        nonMovingResizingChildrenBBox[ DIRECTION_TO_TRBL[ direction ] ];

      if (direction === 'n') {
        spaceToolConstraints.bottom = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 'w') {
        spaceToolConstraints.right = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 's') {
        spaceToolConstraints.top = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      } else if (direction === 'e') {
        spaceToolConstraints.left = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      }
    }

    if (movingChildren.length) {
      movingChildrenBBox = addPadding(asTRBL(getBBox(movingChildren)));

      minOrMax = start -
        movingChildrenBBox[ DIRECTION_TO_TRBL[ DIRECTION_TO_OPPOSITE[ direction ] ] ] +
        resizingShapeBBox[ DIRECTION_TO_TRBL[ DIRECTION_TO_OPPOSITE[ direction ] ] ];

      if (direction === 'n') {
        spaceToolConstraints.bottom = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 'w') {
        spaceToolConstraints.right = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 's') {
        spaceToolConstraints.top = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      } else if (direction === 'e') {
        spaceToolConstraints.left = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      }
    }

    var resizingShapeMinDimensions = minDimensions && minDimensions[ resizingShape.id ];

    if (resizingShapeMinDimensions) {
      if (direction === 'n') {
        minOrMax = start +
          resizingShape[ AXIS_TO_DIMENSION [ axis ] ] -
          resizingShapeMinDimensions[ AXIS_TO_DIMENSION[ axis ] ];

        spaceToolConstraints.bottom = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 'w') {
        minOrMax = start +
          resizingShape[ AXIS_TO_DIMENSION [ axis ] ] -
          resizingShapeMinDimensions[ AXIS_TO_DIMENSION[ axis ] ];

        spaceToolConstraints.right = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 's') {
        minOrMax = start -
          resizingShape[ AXIS_TO_DIMENSION [ axis ] ] +
          resizingShapeMinDimensions[ AXIS_TO_DIMENSION[ axis ] ];

        spaceToolConstraints.top = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      } else if (direction === 'e') {
        minOrMax = start -
          resizingShape[ AXIS_TO_DIMENSION [ axis ] ] +
          resizingShapeMinDimensions[ AXIS_TO_DIMENSION[ axis ] ];

        spaceToolConstraints.left = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      }
    }
  });

  return spaceToolConstraints;
}

function includes(array, item) {
  return array.indexOf(item) !== -1;
}

function isLabel(element) {
  return !!element.labelTarget;
}
