import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
function frame() {
  const handlers = new Map(), messages = [];
  runInNewContext(readFileSync('flutter_app/web/ad-scroll.js', 'utf8'), {
    window: { addEventListener(name, callback) { handlers.set(name, callback); } },
    parent: { postMessage(message) { messages.push(JSON.parse(message)); } }, innerHeight: 600,
  });
  return { fire: (name, event = {}) => handlers.get(name)(event), messages };
}
test('an upward swipe over the ad forwards scrolling and resets after touch end', () => {
  const {fire,messages}=frame();
  fire('touchstart',{touches:[{screenY:400,clientY:300}]});
  fire('touchmove',{touches:[{screenY:250,clientY:300}]});
  assert.equal(messages[0].type,'xxxr-ad-scroll');assert.equal(messages[0].delta,150);
  fire('touchend');fire('touchmove',{touches:[{screenY:100}]});assert.equal(messages.length,1);
});
test('wheel scrolling normalizes line units and bounds excessive movement', () => {
  const {fire,messages}=frame();let prevented=false;
  fire('wheel',{deltaY:3,deltaMode:1,preventDefault(){prevented=true;}});
  assert.equal(messages[0].delta,48);assert.ok(prevented);
  fire('wheel',{deltaY:100000,deltaMode:0,preventDefault(){}});assert.equal(messages[1].delta,1000);
  fire('wheel',{deltaY:NaN,deltaMode:0,preventDefault(){}});assert.equal(messages.length,2);
});
test('host accepts only valid scrolling from the known sandboxed ad frame', () => {
  const sender={},events=[];let receive;let source='https://www.xxxr.online/watch/native-ad.html';
  runInNewContext(readFileSync('flutter_app/web/ad-scroll-host.js','utf8'),{
    URL,
    window:{addEventListener(name,callback){receive=callback;},dispatchEvent(event){events.push(event);}},
    document:{baseURI:'https://www.xxxr.online/watch/index.html',querySelectorAll(){return [{src:source,contentWindow:sender}];}},
    CustomEvent:class {constructor(type,{detail}){this.type=type;this.detail=detail;}},
  });
  const event={origin:'null',source:sender,data:JSON.stringify({type:'xxxr-ad-scroll',delta:125})};
  receive({...event,source:{}});receive({...event,origin:'https://untrusted.example'});receive({...event,data:'invalid'});
  receive({...event,data:JSON.stringify({type:'xxxr-ad-scroll',delta:1001})});
  assert.equal(events.length,0);
  receive(event);assert.equal(events.length,1);assert.equal(events[0].type,'xxxr-ad-scroll');assert.equal(events[0].detail,'125');
  source='https://www.xxxr.online/watch/native-ad.html?placement=native&slot=8';
  receive(event);assert.equal(events.length,2,'Additional banner frames can forward gestures');
  source='https://untrusted.example/watch/native-ad.html';receive(event);assert.equal(events.length,2);
});
test('nine ad panels request nine banners but only one popunder and social bar',()=>{
 const sources=[];
 for(let slot=0;slot<9;slot++)runInNewContext(readFileSync('flutter_app/web/ad-loader.js','utf8'),{
  URLSearchParams,location:{search:slot===0?'':`?placement=native&slot=${slot}`},
  document:{createElement(){return {setAttribute(){}};},body:{append(script){sources.push(script.src);}}},
 });
 assert.equal(sources.filter(src=>src.includes('/21/')).length,9);
 assert.equal(sources.filter(src=>src.includes('benchform.org')).length,1);
 assert.equal(sources.filter(src=>src.includes('/14/')).length,1);
});
