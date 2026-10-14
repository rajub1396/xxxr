import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { publicVideos, videoPath, termPath, termGroups, groupLabels } from '../../../lib/search-pages';
import { SearchShell } from '../../browse/components';
import SponsoredWatchLink from '../sponsored-watch-link';
import '../../search-pages.css';
export const dynamic='force-dynamic';
type Props={params:Promise<{id:string}>};
async function lookup(params:Props['params']) {const {id}=await params;const video=(await publicVideos()).find(video=>video.id===id);if(!video)notFound();return video;}
export async function generateMetadata({params}:Props):Promise<Metadata>{const video=await lookup(params);return {title:`${video.title} | xxxr`,description:video.description.slice(0,160)||`${video.title} in the xxxr adult video library. Adults 18+ only.`,alternates:{canonical:videoPath(video.id)},openGraph:{title:`${video.title} | xxxr`,url:videoPath(video.id)}};}
export default async function VideoPage({params}:Props) {const video=await lookup(params);return <SearchShell><h1>{video.title}</h1><p>{video.description}</p><p>{video.premium?'Premium video — active membership required.':'Free video.'} Adults aged 18 or older only.</p><SponsoredWatchLink id={video.id}/>{termGroups.map(group=>video[group].length>0&&<section key={group}><h2>{groupLabels[group]}</h2><div className="search-links">{video[group].map(term=><Link href={termPath(group,term.id)} key={term.id}>{term.name}</Link>)}</div></section>)}</SearchShell>;}
