CREATE TABLE `changeover_attributes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`hierarchy_level` integer NOT NULL,
	`default_minutes` real DEFAULT 0 NOT NULL,
	`parallel_group` text DEFAULT 'default' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `changeover_attributes_name_idx` ON `changeover_attributes` (`name`);--> statement-breakpoint
CREATE INDEX `changeover_attributes_active_idx` ON `changeover_attributes` (`is_active`);--> statement-breakpoint
CREATE TABLE `changeover_matrix` (
	`id` text PRIMARY KEY NOT NULL,
	`attribute_id` text NOT NULL,
	`from_value` text NOT NULL,
	`to_value` text NOT NULL,
	`time_minutes` real NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`smed_study_id` text,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`attribute_id`) REFERENCES `changeover_attributes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`smed_study_id`) REFERENCES `smed_studies`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `changeover_matrix_attr_from_to_idx` ON `changeover_matrix` (`attribute_id`,`from_value`,`to_value`);--> statement-breakpoint
CREATE INDEX `changeover_matrix_attribute_idx` ON `changeover_matrix` (`attribute_id`);