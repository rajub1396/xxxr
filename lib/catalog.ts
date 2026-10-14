import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { catalogTerms, videoTerms } from '../db/schema';
import { catalogIds, catalogName, CatalogError } from './catalog-validation.mjs';
export type Kind = 'category'|'performer'|'tag';
type Executor = Pick<ReturnType<typeof getDb>,'select'|'insert'|'delete'|'update'>;
export const kinds = {categories:'category',performers:'performer',tags:'tag'} as const;
export async function catalog() {
  const rows=await getDb().select({id:catalogTerms.id,kind:catalogTerms.kind,name:catalogTerms.name,bio:catalogTerms.bio,image:catalogTerms.image,created:catalogTerms.created,usage:sql<number>`count(${videoTerms.videoId})::int`}).from(catalogTerms).leftJoin(videoTerms,eq(catalogTerms.id,videoTerms.termId)).groupBy(catalogTerms.id).orderBy(asc(catalogTerms.name));
  return {categories:rows.filter(row=>row.kind==='category'),performers:rows.filter(row=>row.kind==='performer'),tags:rows.filter(row=>row.kind==='tag')};
}
export async function decorateVideos<T extends {id:string;category:string}>(rows:T[]) {
  if(!rows.length)return [];
  const links=await getDb().select({videoId:videoTerms.videoId,id:catalogTerms.id,kind:catalogTerms.kind,name:catalogTerms.name,bio:catalogTerms.bio,image:catalogTerms.image}).from(videoTerms).innerJoin(catalogTerms,eq(videoTerms.termId,catalogTerms.id)).where(inArray(videoTerms.videoId,rows.map(row=>row.id))).orderBy(asc(catalogTerms.name));
  return rows.map(row=>{
    const assigned=links.filter(link=>link.videoId===row.id).map(({videoId,...term})=>term);
    const categories=assigned.filter(term=>term.kind==='category');
    return {...row,category:categories.map(term=>term.name).join(' · ')||'Uncategorized',categories,performers:assigned.filter(term=>term.kind==='performer'),tags:assigned.filter(term=>term.kind==='tag')};
  });
}
export async function assignVideoTerms(db:Executor,videoId:string,body:Record<string,unknown>,create=false) {
  const current=create?[]:await db.select({id:catalogTerms.id,kind:catalogTerms.kind}).from(videoTerms).innerJoin(catalogTerms,eq(videoTerms.termId,catalogTerms.id)).where(eq(videoTerms.videoId,videoId));
  const groups:Record<Kind,string[]>={category:current.filter(t=>t.kind==='category').map(t=>t.id),performer:current.filter(t=>t.kind==='performer').map(t=>t.id),tag:current.filter(t=>t.kind==='tag').map(t=>t.id)};
  for(const [field,kind] of [['categoryIds','category'],['performerIds','performer'],['tagIds','tag']] as const){
    if(field in body){
      const ids=catalogIds(body[field]) as string[];
      if(ids.length){const valid=await db.select({id:catalogTerms.id}).from(catalogTerms).where(and(eq(catalogTerms.kind,kind),inArray(catalogTerms.id,ids)));if(valid.length!==ids.length)throw new CatalogError('A selected catalog entry no longer exists. Refresh and try again.');}
      groups[kind]=ids;
    }
  }
  if(create && !('categoryIds' in body)){
    const name=catalogName(typeof body.category==='string'&&body.category.trim()?body.category:'General');
    await db.insert(catalogTerms).values({id:crypto.randomUUID(),kind:'category',...name,created:Date.now()}).onConflictDoNothing();
    const [category]=await db.select().from(catalogTerms).where(and(eq(catalogTerms.kind,'category'),eq(catalogTerms.nameKey,name.nameKey)));
    groups.category=[category.id];
  }
  await db.delete(videoTerms).where(eq(videoTerms.videoId,videoId));
  const ids=[...groups.category,...groups.performer,...groups.tag];
  if(ids.length)await db.insert(videoTerms).values(ids.map(termId=>({videoId,termId})));
}
