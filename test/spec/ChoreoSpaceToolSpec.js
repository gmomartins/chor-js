import { bootstrapChorModeler, inject , createCanvasEvent} from '../TestHelper';

import { isMac } from 'diagram-js/lib/util/Platform';


describe('feature/space-tool', function() {

  var basicXML = require('../resources/oneTask.bpmn');
  beforeEach(bootstrapChorModeler(basicXML));

  describe('selection', function() {
    it('selects bands as resizable', function(dragging, spaceTool) {

    })
    it('selects messages as movable', function() {

    });
  });
  describe('task moving', function() {
    it.only('keeps messages attached when moving task right', moveSpaceTool(50,0,10,0, false,function(canvas, elementRegistry) {
      let upperMessage = getTopMessage(elementRegistry);
      let bottomMessage = getBottomMessage(elementRegistry);

      const task = getTask(elementRegistry);
      expect(task.x).to.equal(100 + 10);
      expect(upperMessage.x).to.equal(task.x + task.width / 2 - upperMessage.width / 2);
      expect(bottomMessage.x).to.equal(task.x + task.width / 2 - bottomMessage.width / 2);

    }));
    it('keeps bands attached when moving task right', function() {

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

/// helper
function moveSpaceTool(startX, startY, deltaX, deltaY, pressModifierKey, func){
  return inject(function(dragging, spaceTool, canvas, elementRegistry){

    dragging.setOptions({ manual: true });
    spaceTool.activateMakeSpace(createCanvasEvent({ x: startX, y: startY }));

    // when
    if(pressModifierKey){
      const keyModifier = isMac() ? { metaKey: true } : { ctrlKey: true };
      dragging.move(createCanvasEvent({ x: startX + deltaX, y: startY + deltaY }, keyModifier));
    } else {
      dragging.move(createCanvasEvent({ x: startX + deltaX, y: startY + deltaY }));
    }

    dragging.end();
    func(canvas, elementRegistry);
  });
}

function getTask(elementRegistry){
  return elementRegistry.get('ChoreographyTask_Activity');
}

function getTopMessage(elementRegistry){
  return elementRegistry.get('Message_M1');
}

function getBottomMessage(elementRegistry){
  return elementRegistry.get('Message_M2');
}
