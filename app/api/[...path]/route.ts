import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { videos, members } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status=200) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
function normalizeEmbed(input: string) {
 const u = new URL(input.trim());
 if(u.protocol !== 'https:') throw Error('Use an HTTPS video link.');
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(u.hostname)) {
  const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || u.pathname.split('/').pop();
  if(!id || !/^[\w-]{11}$/.test(id)) throw Error('Invalid YouTube video link.');
  return `https://www.youtube-nocookie.com/embed/${id}`;
 }
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(u.hostname)) {
  const id=u.pathname.split('/').pop(); if(!id || !/^\d+$/.test(id)) throw Error('Invalid Vimeo video link.');
  return `https://player.vimeo.com/video/${id}`;
 }
 throw Error('Use a YouTube or Vimeo video URL.');
}
async function handle(req: Request) {
 try {
  const db=getDb(), user=await getChatGPTUser();
  const admin=user?.email.toLowerCase()==='rajuit1396@gmail.com';
  if(user) await db.insert(members).values({id:user.userId,email:user.email}).onConflictDoUpdate({target:members.id,set:{email:user.email}});
  const member=user ? (await db.select().from(members).where(eq(members.id,user.userId)))[0] : null;
  const premium=admin || !!member?.premium;
  const path=new URL(req.url).pathname.split('/').filter(Boolean).slice(1);
  if(req.method==='GET' && path[0]==='me') return reply({email:user?.email??null,admin,premium});
  if(req.method==='GET' && path[0]==='videos') {
   if(path[1]) { const v=(await db.select().from(videos).where(eq(videos.id,path[1])))[0]; if(!v) return reply({error:'Video not found'},404); if(v.premium && !premium) return reply({error:'Premium access required. Contact the admin to activate your membership.'},403); return reply(v); }
   const all=await db.select().from(videos).orderBy(desc(videos.created)); return reply(all.map(({embed,...v})=>v));
  }
  if(!admin) return reply({error:'Admin access required'},403);
  if(req.method!=='GET' && new URL(req.headers.get('origin') || req.url).origin!==new URL(req.url).origin) return reply({error:'Invalid origin'},403);
  if(req.method==='GET' && path[0]==='members') return reply(await db.select().from(members));
  if(req.method==='POST' && path[0]==='videos') {
   const b=await req.json() as Record<string, unknown>; if(typeof b.title!=='string'||!b.title.trim()||b.title.length>120||typeof b.embed!=='string') return reply({error:'Enter a title and valid video URL.'},400);
   const v={id:crypto.randomUUID(),title:b.title.trim(),description:String(b.description||'').slice(0,1000),category:String(b.category||'General').slice(0,40),embed:normalizeEmbed(b.embed),premium:b.premium?1:0,created:Date.now()};
   await db.insert(videos).values(v); return reply({id:v.id},201);
  }
  if(req.method==='DELETE' && path[0]==='videos' && path[1]) {await db.delete(videos).where(eq(videos.id,path[1]));return reply({ok:true});}
  if(req.method==='PATCH' && path[0]==='members' && path[1]) {const b=await req.json() as Record<string, unknown>; await db.update(members).set({premium:b.premium?1:0}).where(eq(members.id,path[1]));return reply({ok:true});}
  return reply({error:'Not found'},404);
 } catch(e) { console.error(e); return reply({error:e instanceof Error && /video|YouTube|Vimeo|HTTPS/.test(e.message)?e.message:'Unable to complete request. Please try again.'},400); }
}
export const GET=handle, POST=handle, PATCH=handle, DELETE=handle;
