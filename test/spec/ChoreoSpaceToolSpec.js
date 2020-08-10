import { bootstrapChorModeler, inject, createCanvasEvent, getBounds } from '../TestHelper';

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
  describe('task moving keeps participants and messages attached', function() {
    const tests = [
      { deltaX: 100, message: 'to the right when pushing from the left' },
      { deltaX: -100, message: 'to the left when pulling from the left' },
      { deltaX: -100, startX: 500, pressModifierKey: true, message: 'to the left when pushing from the right' },
      { deltaX: 100, startX: 500, pressModifierKey: true, message: 'to the right when pulling from the right' },
      { deltaY: 100, message: 'downwards when pushing from above' },
      { deltaY: 100, startY: 500, pressModifierKey: true, message: 'downwards when pulling from below' },
      { deltaY: -100, message: 'upwards when pulling from above' },
      { deltaY: -100, startY: 500, pressModifierKey: true, message: 'upwards when pushing from below' },

      { startY: 290, deltaY: -100, message: 'upwards when pulling between band and message' },
      { startY: 290, deltaY: 100, message: 'downwards when pushing between band and message' }

    ];

    tests.forEach(function(config) {
      it('correctly moves task, bands, and messages ' + config.message, function() {
        let topBand = getTopBand(ElementRegistry);
        let bottomBand = getBottomBand(ElementRegistry);
        let upperMessage = getTopMessage(ElementRegistry);
        let bottomMessage = getBottomMessage(ElementRegistry);
        const task = getTask(ElementRegistry);

        const oldTaskX = task.x;
        const oldTaskY = task.y;
        const messageOffset = task.y - upperMessage.y - upperMessage.height; // height + magic number 20
        moveSpaceTool(Dragging, SpaceTool, config);
        // check x
        expect(task.x).to.equal(oldTaskX + (config.deltaX | 0), 'Horizontal movement');

        expect(topBand.x).to.equal(task.x);
        expect(bottomBand.x).to.equal(task.x);

        expect(upperMessage.x).to.equal(task.x + task.width / 2 - upperMessage.width / 2);
        expect(bottomMessage.x).to.equal(task.x + task.width / 2 - bottomMessage.width / 2);

        // check y
        expect(task.y).to.equal(oldTaskY + (config.deltaY | 0));

        expect(topBand.y).to.equal(task.y);
        expect(bottomBand.y).to.equal(task.y + task.height - bottomBand.height);

        expect(upperMessage.y).to.equal(task.y - messageOffset - upperMessage.height);
        expect(bottomMessage.y).to.equal(task.y + task.height + messageOffset);
      });
    });

  });
  describe('task resizing keeps messages attached and resizes bands', function() {
    const tests = [
      { deltaX: 100, message: 'increase size when pulling to the right' },
      { deltaX: -100, pressModifierKey: true, message: 'increase size when pulling to the left' },
      { deltaY: 100, message: 'increase size when pulling downwards' },
      { deltaY: -100, pressModifierKey: true, message: 'increase size when pulling upwards' },

    ];

    tests.forEach(function(config) {
      it('correctly ' + config.message + ' and keeps message attached', function() {
        let upperBand = getTopBand(ElementRegistry);
        let bottomBand = getBottomBand(ElementRegistry);
        let upperMessage = getTopMessage(ElementRegistry);
        let bottomMessage = getBottomMessage(ElementRegistry);
        const task = getTask(ElementRegistry);

        const oldTaskBounds = getBounds(task);
        const oldUpperBandBounds = getBounds(upperBand);
        const oldBottomBandBounds = getBounds(bottomBand);
        const messageOffset = task.y - upperMessage.y - upperMessage.height; // height + magic number = 20

        config.startX = config.startX || oldTaskBounds.x + 0.5 * oldTaskBounds.width;
        config.startY = config.startY || oldTaskBounds.y + 0.5 * oldTaskBounds.height;

        moveSpaceTool(Dragging, SpaceTool, config);
        // check x
        expect(task.width).to.equal(oldTaskBounds.width + (Math.abs(config.deltaX) | 0));

        expect(upperBand.width).to.equal(task.width);
        expect(bottomBand.width).to.equal(task.width);

        expect(upperMessage.x).to.equal(task.x + task.width / 2 - upperMessage.width / 2);
        expect(bottomMessage.x).to.equal(task.x + task.width / 2 - bottomMessage.width / 2);

        // check y
        expect(task.height).to.equal(oldTaskBounds.height + (Math.abs(config.deltaY) | 0));

        expect(upperBand.y).to.equal(task.y);
        expect(bottomBand.y).to.equal(task.y + task.height - bottomBand.height);

        expect(upperBand.height).to.equal(oldUpperBandBounds.height);
        expect(bottomBand.height).to.equal(oldBottomBandBounds.height);

        expect(upperMessage.y).to.equal(task.y - messageOffset - upperMessage.height);
        expect(bottomMessage.y).to.equal(task.y + task.height + messageOffset);
      });
    });

    // todo size decreasing missing
  });
});

// / helper
function moveSpaceTool(dragging, spaceTool, { startX = 150, startY = 150, deltaX = 0, deltaY = 0, pressModifierKey = false, message = '' }) {

  if (!(Math.abs(deltaX) >= 100 || Math.abs(deltaY) >= 100)) {
    console.warn('Delta is not large enough. The graphical representation will start auto-scrolling to infinity. ' +
      'This should however not affect the test result');
  }

  const keyModifier = pressModifierKey ? (isMac() ? { metaKey: true } : { ctrlKey: true }) : {};

  spaceTool.activateMakeSpace(createCanvasEvent({ x: startX, y: startY }));

  dragging.move(createCanvasEvent({ x: startX + deltaX, y: startY + deltaY }, keyModifier));

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

