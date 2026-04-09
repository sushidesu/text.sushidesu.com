CREATE TABLE `image` (
	`image_id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`key_2x` text,
	`mime_type` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`size` integer NOT NULL,
	`original_filename` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `image_key_unique` ON `image` (`key`);--> statement-breakpoint
CREATE INDEX `image_created_at_idx` ON `image` (`created_at`);