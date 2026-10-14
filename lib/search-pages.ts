import { cache } from 'react';
import { desc } from 'drizzle-orm';
import { getDb } from '../db';
import { videos } from '../db/schema';
import { catalog, decorateVideos } from './catalog';

export const siteUrl = 'https://www.xxxr.online';
export const publicCatalog = cache(catalog);
// Public pages never select or serialize the protected player URL.
export const publicVideos = cache(async () => decorateVideos(await getDb().select({
  id: videos.id, title: videos.title, description: videos.description,
  category: videos.category, premium: videos.premium, created: videos.created,
}).from(videos).orderBy(desc(videos.created))));
export const termGroups = ['categories', 'performers', 'tags'] as const;
export type TermGroup = typeof termGroups[number];
export function isTermGroup(value: string): value is TermGroup {
  return termGroups.some(group => group === value);
}
export const groupLabels = { categories: 'Categories', performers: 'Performers', tags: 'Tags' };
export function termPath(group: TermGroup, id: string) { return `/browse/${group}/${encodeURIComponent(id)}`; }
export function videoPath(id: string) { return `/videos/${encodeURIComponent(id)}`; }
