import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
function setup(ready=false){
 const scripts=[],events=[],handlers=new Map();let mutation,resize,disconnected=false;
 const wrapper={addEventListener(name,callback){handlers.set(name,callback);}};
 const slot={parentElement:wrapper,scrollHeight:220,getBoundingClientRect(){return {height:220};}};
 const document={scripts,documentElement:{},getElementById(){return ready?slot:null;},createElement(){return {setAttribute(){}};},body:{append(script){scripts.push(script);}}};
 runInNewContext(readFileSync('flutter_app/web/native-ad-host.js','utf8'),{
  document,innerHeight:600,window:{dispatchEvent(event){events.push(event);}},
  CustomEvent:class {constructor(type,{detail}){this.type=type;this.detail=detail;}},
  MutationObserver:class {constructor(callback){mutation=callback;}observe(){}disconnect(){disconnected=true;}},
  ResizeObserver:class {constructor(callback){resize=callback;}observe(){}},
 });
 return {scripts,events,handlers,attach(){ready=true;mutation();},resize(){resize();},get disconnected(){return disconnected;}};
}
test('native script waits for its real DOM container before loading and reports its height',()=>{
 const host=setup();assert.equal(host.scripts.length,0);
 host.attach();assert.equal(host.scripts.length,1);assert.ok(host.disconnected);
 assert.equal(host.scripts[0].src,'https://biomanos.org/21/d82e2ef4e500984773e34fa088c1400a');
 host.resize();assert.equal(host.events[0].type,'xxxr-native-ad-size');assert.equal(host.events[0].detail,'220');
});
test('native banner swipe and wheel movement reach the library scroll handler',()=>{
 const host=setup(true);
 host.handlers.get('touchstart')({touches:[{screenY:400}]});
 host.handlers.get('touchmove')({touches:[{screenY:250}]});
 assert.equal(host.events[0].type,'xxxr-ad-scroll');assert.equal(host.events[0].detail,'150');
 host.handlers.get('touchend')();host.handlers.get('touchmove')({touches:[{screenY:100}]});assert.equal(host.events.length,1);
 let prevented=false;host.handlers.get('wheel')({deltaY:3,deltaMode:1,preventDefault(){prevented=true;}});
 assert.ok(prevented);assert.equal(host.events[1].detail,'48');
});
