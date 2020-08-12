import SpaceTool from 'diagram-js/lib/features/space-tool/SpaceTool';
import inherits from 'inherits';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { filter, forEach, isNumber, assign } from 'min-dash';
import { asTRBL } from 'diagram-js/lib/layout/LayoutUtil';

import { getBBox } from 'diagram-js/lib/util/Elements';

import { getDirection } from 'diagram-js/lib/features/space-tool/SpaceUtil';

import { hasPrimaryModifier } from 'diagram-js/lib/util/Mouse';

import { set as setCursor } from 'diagram-js/lib/util/Cursor';

import { selfAndAllChildren } from 'diagram-js/lib/util/Elements';

const abs = Math.abs;
const round = Math.round;


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
  const axis = abs(event.dx) > abs(event.dy) ? 'x' : 'y';
  let delta = event[ 'd' + axis ];
  const start = event[ axis ] - delta;

  if (abs(delta) < 5) {
    return false;
  }

  // invert delta to remove space when moving left
  if (delta < 0) {
    delta *= -1;
  }

  // invert delta to add/remove space when removing/adding space if modifier key is pressed
  if (hasPrimaryModifier(event)) {
    delta *= -1;
  }

  const direction = getDirection(axis, delta);

  const root = this._canvas.getRootElement();

  const children = selfAndAllChildren(root, true);

  const elements = this.calculateAdjustments(children, axis, delta, start);

  const minDimensions = this._eventBus.fire('spaceTool.getMinDimensions', {
    axis: axis,
    direction: direction,
    shapes: elements.resizingShapes,
    start: start
  });

  const spaceToolConstraints = this.getSpaceToolConstraints(elements, axis, direction, start, minDimensions);

  assign(
    context,
    elements,
    {
      axis: axis,
      direction: direction,
      spaceToolConstraints: spaceToolConstraints,
      start: start
    }
  );

  setCursor('resize-' + (axis === 'x' ? 'ew' : 'ns'));

  return true;
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

ChoreoSpaceTool.prototype.getSpaceToolConstraints = function(elements, axis, direction, start, minDimensions) {
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
        !includes(resizingShapes, child) &&
        !is(child, 'bpmn:Participant') && // We need to skip participants and messages as they will move and scale when the activity moves or scales
        !is(child, 'bpmn:Message');
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
};

function includes(array, item) {
  return array.indexOf(item) !== -1;
}

function isLabel(element) {
  return !!element.labelTarget;
}
