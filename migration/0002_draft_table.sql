CREATE TABLE `draft` (
	`draft_id` text PRIMARY KEY NOT NULL,
	`post_id` text REFERENCES `post`(`post_id`),
	`title` text NOT NULL DEFAULT '',
	`body` text NOT NULL DEFAULT '',
	`slug` text NOT NULL DEFAULT '',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `draft` (`draft_id`, `post_id`, `title`, `body`, `slug`, `created_at`, `updated_at`)
SELECT `post_id`, `post_id`, `title`, `body`, `slug`, `created_at`, `updated_at` FROM `post`;
