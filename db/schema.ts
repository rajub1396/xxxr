import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const videos = sqliteTable('videos', { id: text('id').primaryKey(), title: text('title').notNull(), description: text('description').notNull(), category: text('category').notNull(), embed: text('embed').notNull(), premium: integer('premium').notNull().default(0), created: integer('created').notNull() });
export const members = sqliteTable('members', { id: text('id').primaryKey(), email: text('email').notNull(), premium: integer('premium').notNull().default(0) });
