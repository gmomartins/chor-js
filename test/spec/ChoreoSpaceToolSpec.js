import { bootstrapChorModeler, inject, createCanvasEvent } from '../TestHelper';

import { isMac } from 'diagram-js/lib/util/Platform';
import { delta } from 'diagram-js/lib/util/PositionUtil';

describe('feature/space-tool', function() {

  var basicXML = require('../resources/oneTask.bpmn');
  beforeEach(bootstrapChorModeler(basicXML));
  let Dragging, SpaceTool, Canvas, ElementRegistry;
  beforeEach(inject(function(dragging, spaceTool, canvas, elementRegistry) {
    Dragging = dragging;
    SpaceTool = spaceTool;
    Canvas = canvas;
    ElementRegistry = elementRegistry;
    console.log('ran');
  }));

  describe('selection', function() {
    it('selects bands as resizable', function(dragging, spaceTool) {

    });
    it('selects messages as movable', function() {

    });
  });
  describe.only('task moving', function() {
    const tests = [
      { deltaX: 100, deltaY: 0 }, //right
      { deltaX: -100, deltaY: 0, pressModifierKey: true}, // left
      { deltaX: 0,deltaY: 100 }, // down
      ]

    tests.forEach(function(config) {
      it('correctly moves task by ' + JSON.stringify(config) + ' and keeps messages and participants attached', function() {
        let topBand = getTopBand(ElementRegistry);
        let bottomBand = getBottomBand(ElementRegistry);
        let upperMessage = getTopMessage(ElementRegistry);
        let bottomMessage = getBottomMessage(ElementRegistry);
        const task = getTask(ElementRegistry);

        const oldTaskX = task.x;
        const oldTaskY = task.y
        moveSpaceTool(Dragging, SpaceTool, config);
        // check x
        expect(task.x).to.equal(oldTaskX + config.deltaX);
        expect(topBand.x).to.equal(task.x);
        expect(bottomBand.x).to.equal(task.x);
        expect(upperMessage.x).to.equal(task.x + task.width / 2 - upperMessage.width / 2);
        expect(bottomMessage.x).to.equal(task.x + task.width / 2 - bottomMessage.width / 2);

        //check y
        expect(task.y).to.equal(oldTaskY + config.deltaY);
        expect(topBand.y).to.equal(task.y);
        expect(bottomBand.y).to.equal(task.y + task.height - bottomBand.height);
        debugger;
        // jo its actually not moved damn
        expect(upperMessage.y).to.equal(task.y - upperMessage.height);
        expect(bottomMessage.y).to.equal(task.y + task.height);
      });
    });


    it('keeps bands and message attached when moving task horizontally', function() {



    });
    it('keeps messages attached when moving task left', function() {

    });
    it('keeps bands attached when moving task left', function() {

    });
    it('keeps messages attached when moving task up', function() {

    });
    it('keeps bands attached when moving task up', function() {

    });
    it('keeps messages attached when moving task down', function() {

    });
    it('keeps bands attached when moving task down', function() {

    });
    it('moves task down when pushing between message and band', function() {

    });
    it('moves task up when pulling between message and band', function() {

    });
  });
  describe('task resizing', function() {
    it('keeps messages centered when increasing task width', function() {

    });
    it('keeps bands attached increasing task width', function() {

    });

    it('keeps messages centered when decreasing task width', function() {

    });
    it('keeps bands attached decreasing task width', function() {

    });

    it('keeps messages centered when increasing task height', function() {

    });
    it('keeps bands attached increasing task height', function() {

    });

    it('keeps messages centered when decreasing task height', function() {

    });
    it('keeps bands attached decreasing task height', function() {

    });
  });
});

// / helper
function moveSpaceTool(dragging, spaceTool, { startX = 150, startY = 150, deltaX = 0, deltaY = 0, pressModifierKey = false }) {

  if (!(deltaX > 100 || deltaY > 100)) {
    console.warn('Delta is not large enough. The graphical representation will start auto-scrolling to infinity. ' +
      'This should however not affect the test result');
  }

  spaceTool.activateMakeSpace(createCanvasEvent({ x: startX, y: startY }, {}));

  // when
  dragging.move(createCanvasEvent({ x: startX + deltaX, y: startY + deltaY }, {}), false);

  dragging.end();
}

function getTask(elementRegistry) {
  return elementRegistry.get('ChoreographyTask_Activity');
}

function getTopMessage(elementRegistry) {
  return elementRegistry.get('Message_M1');
}

function getBottomMessage(elementRegistry) {
  return elementRegistry.get('Message_M2');
}
function getTopBand(elementRegistry) {
  return getTask(elementRegistry).bandShapes[0];
}

function getBottomBand(elementRegistry) {
  return getTask(elementRegistry).bandShapes[1];
}
