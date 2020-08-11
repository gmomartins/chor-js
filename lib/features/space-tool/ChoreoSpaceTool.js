import SpaceTool from 'diagram-js/lib/features/space-tool/SpaceTool';
import inherits from 'inherits';
import { is } from 'bpmn-js/lib/util/ModelUtil';


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
      if(is(element, 'bpmn:Participant')){
        resizingShapes.push(...element.children);
      }
      return resizingShapes.push(element);
    }
  });

  return {
    movingShapes: movingShapes,
    resizingShapes: resizingShapes
  };
};


