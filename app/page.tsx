import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchShell, VideoList } from './browse/components';
import { publicCatalog, publicVideos, termPath } from '../lib/search-pages';
import './search-pages.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title:'xxxr | Adult video library', description:'Browse the xxxr adult video library by category, performer, and tag. Explore free videos and premium membership content. Adults 18+ only.',alternates:{canonical:'/'}};
export default async function Home() {
  const [terms,items] = await Promise.all([publicCatalog(),publicVideos()]);
  return <SearchShell><h1>xxxr adult video library</h1><p>the best porn site.</p><p>Explore adult videos by category, performer, and tag. Browse free videos and premium membership content in the xxxr library. For adults aged 18 or older.</p><a className="search-action" href="/watch/index.html">Enter the video library — 18+</a><h2>Browse categories</h2><div className="search-links">{terms.categories.filter(term=>term.usage>0).map(term=><Link key={term.id} href={termPath('categories',term.id)}>{term.name}</Link>)}<Link href="/browse">All categories, performers, and tags</Link></div><h2>Latest videos</h2><VideoList items={items.slice(0,24)}/></SearchShell>;
}
