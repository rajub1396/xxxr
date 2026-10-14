CREATE TABLE "catalog_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "catalog_terms_kind_name_unique" UNIQUE("kind","name_key")
);
--> statement-breakpoint
CREATE TABLE "video_terms" (
	"video_id" text NOT NULL,
	"term_id" text NOT NULL,
	CONSTRAINT "video_terms_video_id_term_id_pk" PRIMARY KEY("video_id","term_id")
);
--> statement-breakpoint
ALTER TABLE "video_terms" ADD CONSTRAINT "video_terms_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_terms" ADD CONSTRAINT "video_terms_term_id_catalog_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."catalog_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_terms_term_idx" ON "video_terms" USING btree ("term_id");
--> statement-breakpoint
INSERT INTO "catalog_terms" ("id","kind","name","name_key","created")
SELECT md5('category:' || lower(regexp_replace(btrim("category"),'[[:space:]]+',' ','g'))), 'category',
       min(regexp_replace(btrim("category"),'[[:space:]]+',' ','g')),
       lower(regexp_replace(btrim("category"),'[[:space:]]+',' ','g')), (extract(epoch FROM now())*1000)::bigint
FROM "videos" WHERE btrim("category")<>''
GROUP BY lower(regexp_replace(btrim("category"),'[[:space:]]+',' ','g'))
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog_terms" ("id","kind","name","name_key","created") VALUES (md5('category:general'),'category','General','general',(extract(epoch FROM now())*1000)::bigint) ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "video_terms" ("video_id","term_id")
SELECT "videos"."id","catalog_terms"."id" FROM "videos" JOIN "catalog_terms"
ON "catalog_terms"."kind"='category' AND "catalog_terms"."name_key"=lower(regexp_replace(btrim("videos"."category"),'[[:space:]]+',' ','g'))
ON CONFLICT DO NOTHING;
