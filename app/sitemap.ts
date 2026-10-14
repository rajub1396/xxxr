import type { MetadataRoute } from 'next';
import { publicCatalog, publicVideos, siteUrl, termGroups, termPath, videoPath } from '../lib/search-pages';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const [terms,items]=await Promise.all([publicCatalog(),publicVideos()]);
  return [{url:siteUrl+'/'},{url:siteUrl+'/browse'},...termGroups.flatMap(group=>terms[group].filter(term=>term.usage>0).map(term=>({url:siteUrl+termPath(group,term.id)}))),...items.map(video=>({url:siteUrl+videoPath(video.id)}))];
}
