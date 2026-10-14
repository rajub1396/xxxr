import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getPool} from '../db/pool.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3100';const origin=new URL(base).origin;const pool=getPool();
let cookie='',videoId;const ids=[];const suffix=randomUUID().slice(0,8);
async function request(path,method='GET',body,expected=200,authenticated=true){
 const response=await fetch(`${base}/api/${path}`,{method,redirect:'manual',headers:{Origin:origin,'Content-Type':'application/json',...(authenticated&&cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,expected,`${method} ${path}: got ${response.status}`);return await response.json();
}
try{
 const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:process.env.ADMIN_EMAIL||'rajuit1396@gmail.com',password:process.env.ADMIN_INITIAL_PASSWORD})});assert.equal(login.status,200);cookie=login.headers.getSetCookie().find(value=>value.startsWith('redx_session='))?.split(';')[0];assert.ok(cookie);
 const make=async(group,name)=>{const entry=await request(group,'POST',{name:`E2E ${name} ${suffix}`},201);ids.push(entry.id);return entry;};
 const c1=await make('categories','Category A'),c2=await make('categories','Category B'),p1=await make('performers','Performer A'),p2=await make('performers','Performer B'),t1=await make('tags','Tag A'),t2=await make('tags','Tag B');
 await request('categories','POST',{name:c1.name.toUpperCase()},409);
 await request('performers','POST',{name:`Denied ${suffix}`},403,false);
 console.log('PASS category, performer, and tag creation; duplicate and permission checks');
 const created=await request('videos','POST',{title:`Catalog E2E ${suffix}`,embed:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',description:'Temporary catalog test',premium:false,categoryIds:[c1.id,c2.id],performerIds:[p1.id,p2.id],tagIds:[t1.id]},201);videoId=created.id;
 let video=await request(`videos/${videoId}`);assert.equal(video.categories.length,2);assert.equal(video.performers.length,2);assert.equal(video.tags.length,1);
 for(const [query,id]of[['category',c1.id],['performer',p1.id],['tag',t1.id]])assert.ok((await request(`videos?${query}=${id}`,'GET',undefined,200,false)).some(item=>item.id===videoId));
 assert.ok((await request('catalog','GET',undefined,200,false)).categories.some(item=>item.id===c1.id&&item.usage===1));
 console.log('PASS multiple catalog assignments, usage counts, and public browse filters');
 await request(`categories/${c1.id}`,'PATCH',{name:`Renamed ${suffix}`});
 await request(`performers/${p1.id}`,'PATCH',{name:`Performer renamed ${suffix}`,bio:'Updated performer biography',image:'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'});
 video=await request(`videos/${videoId}`);assert.ok(video.category.includes('Renamed'));assert.equal(video.performers.find(item=>item.id===p1.id).bio,'Updated performer biography');
 await request(`videos/${videoId}`,'PATCH',{title:`Edited catalog video ${suffix}`,description:'Edited description',categoryIds:[c2.id],performerIds:[p1.id,p2.id],tagIds:[t1.id,t2.id]});
 video=await request(`videos/${videoId}`);assert.equal(video.title,`Edited catalog video ${suffix}`);assert.equal(video.categories.length,1);assert.equal(video.tags.length,2);
 const allTagIds=(await request('tags')).map(tag=>tag.id);
 await request(`videos/${videoId}`,'PATCH',{tagIds:allTagIds});
 assert.equal((await request(`videos/${videoId}`)).tags.length,allTagIds.length);
 await request(`videos/${videoId}`,'PATCH',{tagIds:[]});
 assert.equal((await request(`videos/${videoId}`)).tags.length,0);
 await request(`videos/${videoId}`,'PATCH',{tagIds:[t1.id,t2.id]});
 console.log(`PASS selecting and clearing all ${allTagIds.length} available tags`);
 await request(`videos/${videoId}`,'PATCH',{title:'Must be rolled back',performerIds:[c1.id]},400);
 assert.equal((await request(`videos/${videoId}`)).title,`Edited catalog video ${suffix}`);
 console.log('PASS shared-name updates, performer profiles, video editing, and transactional validation');
 await request(`categories/${c2.id}`,'DELETE');await request(`performers/${p2.id}`,'DELETE');
 video=await request(`videos/${videoId}`);assert.equal(video.categories.length,0);assert.equal(video.category,'Uncategorized');assert.equal(video.performers.length,1);assert.equal(video.id,videoId);
 await request(`tags/${t1.id}`,'DELETE',undefined,403,false);
 console.log('PASS catalog removal preserves videos and unrelated assignments');
 console.log('Catalog end-to-end checks passed.');
}finally{
 if(videoId)await pool.query('DELETE FROM videos WHERE id=$1',[videoId]);
 if(ids.length)await pool.query('DELETE FROM catalog_terms WHERE id=ANY($1::text[])',[ids]);
 if(cookie)await fetch(`${base}/api/auth/logout`,{method:'POST',headers:{Origin:origin,Cookie:cookie}});
 await pool.end();console.log('Temporary catalog test data cleaned up.');
}
