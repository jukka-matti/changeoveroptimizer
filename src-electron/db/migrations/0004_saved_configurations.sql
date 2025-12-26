CREATE TABLE `saved_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`name` text NOT NULL,
	`order_id_column` text NOT NULL,
	`attributes_json` text NOT NULL,
	`last_export_format` text,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	`last_used_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_configurations_fingerprint_unique` ON `saved_configurations` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `saved_configurations_fingerprint_idx` ON `saved_configurations` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `saved_configurations_last_used_idx` ON `saved_configurations` (`last_used_at`);