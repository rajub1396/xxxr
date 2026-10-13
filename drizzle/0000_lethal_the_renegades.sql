CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`premium` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`embed` text NOT NULL,
	`premium` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
