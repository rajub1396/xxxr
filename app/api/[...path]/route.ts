import { getUser, validOrigin } from '../../session-auth';
import { getDb } from '../../../db';
import { videos, members, catalogTerms } from '../../../db/schema';
import { and, eq, desc, ne } from 'drizzle-orm';
import { resolvePreview, youtubePreview } from '../../../lib/video-preview.mjs';
import { previewUrl } from '../../../lib/video-preview.mjs';
import { assignVideoTerms, catalog, decorateVideos, kinds } from '../../../lib/catalog';
import { catalogName, CatalogError } from '../../../lib/catalog-validation.mjs';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status=200) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
function normalizeEmbed(input: string) {
 let value = input.trim();
 if (value.toLowerCase().startsWith('<iframe')) {
  const match = value.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
  if (!match) throw Error('The iframe must contain an HTTPS video src URL.');
  value = match[2].replace(/&amp;/g, '&');
 }
 const u = new URL(value);
 if(u.protocol !== 'https:') throw Error('Use an HTTPS video link.');
 if (u.username || u.password || u.port || !u.hostname.includes('.') || u.hostname.endsWith('.local') || u.hostname.endsWith('.localhost') || /^(\d{1,3}\.){3}\d{1,3}$/.test(u.hostname) || u.hostname.includes(':')) throw Error('Use a public HTTPS video host without credentials or a custom port.');
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(u.hostname)) {
  const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || u.pathname.split('/').pop();
  if(!id || !/^[\w-]{11}$/.test(id)) throw Error('Invalid YouTube video link.');
  return `https://www.youtube-nocookie.com/embed/${id}`;
 }
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(u.hostname)) {
  const id=u.pathname.split('/').pop(); if(!id || !/^\d+$/.test(id)) throw Error('Invalid Vimeo video link.');
  return `https://player.vimeo.com/video/${id}`;
 }
 return u.href;
}
async function handle(req: Request) {
 try {
  const db=getDb(), user=await getUser();
  const admin=!!user?.admin;
  const member=user ? (await db.select().from(members).where(eq(members.id,user.userId)))[0] : null;
  const premium=admin || !!member?.premium;
  const path=new URL(req.url).pathname.split('/').filter(Boolean).slice(1);
  if(req.method==='GET' && path[0]==='me') return reply({email:user?.email??null,admin,premium});
  const group=path[0] as keyof typeof kinds;
  const kind=Object.hasOwn(kinds,group)?kinds[group]:undefined;
  if(req.method==='GET' && path[0]==='catalog')return reply(await catalog());
  if(req.method==='GET' && kind)return reply((await catalog())[group]);
  if(req.method==='GET' && path[0]==='videos') {
   if(path[1]) { const v=(await db.select().from(videos).where(eq(videos.id,path[1])))[0]; if(!v) return reply({error:'Video not found'},404); if(v.premium && !premium) return reply({error:'Premium access required. Contact the admin to activate your membership.'},403); return reply((await decorateVideos([v]))[0]); }
   const all=await decorateVideos(await db.select().from(videos).orderBy(desc(videos.created)));
   const params=new URL(req.url).searchParams;
   const filtered=all.filter(v=>(!params.get('category')||v.categories.some(t=>t.id===params.get('category')))&&(!params.get('performer')||v.performers.some(t=>t.id===params.get('performer')))&&(!params.get('tag')||v.tags.some(t=>t.id===params.get('tag'))));
   return reply(filtered.map(({embed,...v})=>({...v,thumbnail:v.thumbnail || youtubePreview(embed) || '/video-placeholder.svg'})));
  }
  if(!admin) return reply({error:'Admin access required'},403);
  if(req.method!=='GET' && !validOrigin(req)) return reply({error:'Invalid origin'},403);
  if(kind && ['POST','PATCH','DELETE'].includes(req.method)){
   if(req.method==='DELETE'){
    if(!path[1])return reply({error:'Choose an entry to delete.'},400);
    const removed=await db.delete(catalogTerms).where(and(eq(catalogTerms.id,path[1]),eq(catalogTerms.kind,kind))).returning({id:catalogTerms.id});
    return removed.length?reply({ok:true}):reply({error:'Catalog entry not found.'},404);
   }
   const body=await req.json() as Record<string,unknown>;
   const named=catalogName(body.name);
   const duplicate=await db.select({id:catalogTerms.id}).from(catalogTerms).where(and(eq(catalogTerms.kind,kind),eq(catalogTerms.nameKey,named.nameKey),...(path[1]?[ne(catalogTerms.id,path[1])]:[])));
   if(duplicate.length)throw new CatalogError('An entry with this name already exists.',409);
   const fields={...named,bio:typeof body.bio==='string'?body.bio.slice(0,1000):'',image:previewUrl(body.image)};
   if(req.method==='POST'){
    const [entry]=await db.insert(catalogTerms).values({id:crypto.randomUUID(),kind,...fields,created:Date.now()}).returning();return reply(entry,201);
   }
   if(!path[1])return reply({error:'Choose an entry to edit.'},400);
   const [entry]=await db.update(catalogTerms).set(fields).where(and(eq(catalogTerms.id,path[1]),eq(catalogTerms.kind,kind))).returning();return entry?reply(entry):reply({error:'Catalog entry not found.'},404);
  }
  if(req.method==='GET' && path[0]==='members') return reply(await db.select({id:members.id,email:members.email,premium:members.premium}).from(members));
  if(req.method==='POST' && path[0]==='videos') {
   const b=await req.json() as Record<string, unknown>; if(typeof b.title!=='string'||!b.title.trim()||b.title.length>120||typeof b.embed!=='string') return reply({error:'Enter a title and valid video URL.'},400);
   const embed=normalizeEmbed(b.embed);
   const v={id:crypto.randomUUID(),title:b.title.trim(),description:String(b.description||'').slice(0,1000),category:String(b.category||'General').slice(0,40),embed,thumbnail:await resolvePreview(embed,b.thumbnail),premium:b.premium?1:0,created:Date.now()};
   await db.transaction(async tx=>{await tx.insert(videos).values(v);await assignVideoTerms(tx,v.id,b,true);});return reply({id:v.id},201);
  }
  if(req.method==='PATCH' && path[0]==='videos' && path[1]) {
   const existing=(await db.select().from(videos).where(eq(videos.id,path[1])))[0];
   if(!existing) return reply({error:'Video not found'},404);
   const body=await req.json() as Record<string,unknown>;
   if(!['title','description','embed','thumbnail','premium','categoryIds','performerIds','tagIds'].some(key=>key in body))throw new CatalogError('Choose video details to update.');
   if('title' in body && (typeof body.title!=='string'||!body.title.trim()||body.title.length>120))throw new CatalogError('Video titles must contain 1–120 characters.');
   if('embed' in body && typeof body.embed!=='string')throw new CatalogError('Enter a valid video embed.');
   if('thumbnail' in body && typeof body.thumbnail!=='string')throw new CatalogError('Enter a preview image URL or leave it empty for automatic detection.');
   const embed='embed' in body?normalizeEmbed(body.embed as string):existing.embed;
   const thumbnail='thumbnail' in body||embed!==existing.embed?await resolvePreview(embed,body.thumbnail):existing.thumbnail;
   await db.transaction(async tx=>{
    await tx.update(videos).set({title:typeof body.title==='string'?body.title.trim():existing.title,description:typeof body.description==='string'?body.description.slice(0,1000):existing.description,embed,thumbnail,premium:'premium' in body?(body.premium?1:0):existing.premium}).where(eq(videos.id,existing.id));
    await assignVideoTerms(tx,existing.id,body);
   });
   return reply({ok:true,thumbnail:thumbnail || '/video-placeholder.svg'});
  }
  if(req.method==='DELETE' && path[0]==='videos' && path[1]) {await db.delete(videos).where(eq(videos.id,path[1]));return reply({ok:true});}
  if(req.method==='PATCH' && path[0]==='members' && path[1]) {const b=await req.json() as Record<string, unknown>; await db.update(members).set({premium:b.premium?1:0}).where(eq(members.id,path[1]));return reply({ok:true});}
  return reply({error:'Not found'},404);
 } catch(e) { if(e instanceof CatalogError)return reply({error:e.message},e.status);console.error('Video request failed'); return reply({error:e instanceof Error && /video|YouTube|Vimeo|HTTPS|Preview/.test(e.message)?e.message:'Unable to complete request. Please try again.'},400); }
}
export const GET=handle, POST=handle, PATCH=handle, DELETE=handle;
