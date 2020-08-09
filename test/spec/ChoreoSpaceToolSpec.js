import { bootstrapChorModeler, inject, createCanvasEvent } from '../TestHelper';

import { isMac } from 'diagram-js/lib/util/Platform';

describe('feature/space-tool', function() {

  var basicXML = require('../resources/oneTask.bpmn');
  beforeEach(bootstrapChorModeler(basicXML));

  describe('selection', function() {
    it('selects bands as resizable', function(dragging, spaceTool) {

    });
    it('selects messages as movable', function() {

    });
  });
  describe('task moving', function() {
    it('keeps messages attached when moving task right', inject(function(dragging, spaceTool, canvas, elementRegistry) {
      let upperMessage = getTopMessage(elementRegistry);
      let bottomMessage = getBottomMessage(elementRegistry);
      const task = getTask(elementRegistry);
      const taskX = task.x;
      const config = { deltaX: 10 };

      moveSpaceTool(dragging, spaceTool, config);

      expect(task.x).to.equal(taskX + config.deltaX);
      expect(upperMessage.x).to.equal(task.x + task.width / 2 - upperMessage.width / 2);
      expect(bottomMessage.x).to.equal(task.x + task.width / 2 - bottomMessage.width / 2);

    }));
    it('keeps bands attached when moving task right', inject(function(dragging, spaceTool, canvas, elementRegistry) {
      let topBand = getTopBand(elementRegistry);
      let bottomBand = getBottomBand(elementRegistry);
      const task = getTask(elementRegistry);
      const taskX = task.x;
      const config = { deltaX: 10 };

      moveSpaceTool(dragging, spaceTool, config);
      console.log(topBand)
      expect(task.x).to.equal(taskX + config.deltaX);
      expect(topBand.x).to.equal(task.x);
      expect(bottomBand.x).to.equal(task.x);

    }));
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
function moveSpaceTool(dragging, spaceTool, { startX = 0, startY = 0, deltaX = 0, deltaY = 0, pressModifierKey = false }) {

  dragging.setOptions({ manual: true });
  spaceTool.activateMakeSpace(createCanvasEvent({ x: startX, y: startY }));

  // when
  if (pressModifierKey) {
    const keyModifier = isMac() ? { metaKey: true } : { ctrlKey: true };
    dragging.move(createCanvasEvent({ x: startX + deltaX, y: startY + deltaY }, keyModifier));
  } else {
    dragging.move(createCanvasEvent({ x: startX + deltaX, y: startY + deltaY }));
  }

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
  return elementRegistry.get('BPMNShape_P1');
}

function getBottomBand(elementRegistry) {
  return elementRegistry.get('BPMNShape_P2');
}
