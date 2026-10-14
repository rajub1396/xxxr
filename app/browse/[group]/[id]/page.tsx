import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicCatalog, publicVideos, isTermGroup, termPath } from '../../../../lib/search-pages';
import { SearchShell, VideoList } from '../../components';
export const dynamic='force-dynamic';
type Props={params:Promise<{group:string;id:string}>};
async function lookup(params:Props['params']) {
  const {group,id}=await params;if(!isTermGroup(group))notFound();
  const term=(await publicCatalog())[group].find(term=>term.id===id);if(!term)notFound();
  return {group,term};
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {group,term}=await lookup(params);
  return {title:`${term.name} adult videos | xxxr`,description:term.bio.slice(0,160)||`Browse ${term.name} adult videos in the xxxr ${group} catalog. Free and premium content for adults 18+ only.`,alternates:{canonical:termPath(group,term.id)},robots:{index:term.usage>0,follow:true},openGraph:{title:`${term.name} | xxxr`,url:termPath(group,term.id)}};
}
export default async function TermPage({params}:Props) {
  const {group,term}=await lookup(params);
  const items=(await publicVideos()).filter(video=>video[group].some(link=>link.id===term.id));
  return <SearchShell><h1>{term.name} adult videos</h1>{term.bio&&<p>{term.bio}</p>}<p>Browse {items.length} published {term.name} {items.length===1?'video':'videos'} in the xxxr {group} catalog. Adults 18+ only.</p><VideoList items={items}/>{!items.length&&<p>No videos are currently assigned here.</p>}</SearchShell>;
}
