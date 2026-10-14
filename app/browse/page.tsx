import type { Metadata } from 'next';
import Link from 'next/link';
import { publicCatalog, termGroups, termPath, groupLabels } from '../../lib/search-pages';
import { SearchShell } from './components';
export const dynamic = 'force-dynamic';
export const metadata:Metadata={title:'Adult video categories, performers and tags | xxxr',description:'Browse the xxxr adult video catalog by its published categories, performer names, and video tags. Adults 18+ only.',alternates:{canonical:'/browse'}};
export default async function Browse() {
  const terms=await publicCatalog();
  return <SearchShell><h1>Browse the xxxr catalog</h1><p>Find adult videos using the categories, performers, and tags assigned by the xxxr editors.</p>{termGroups.map(group=><section key={group}><h2>{groupLabels[group]}</h2><div className="search-links">{terms[group].map(term=><Link key={term.id} href={termPath(group,term.id)}>{term.name} ({term.usage})</Link>)}</div>{!terms[group].length&&<p>No names in this group yet.</p>}</section>)}</SearchShell>;
}
