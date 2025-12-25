CREATE TABLE `optimization_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`file_name` text,
	`order_count` integer NOT NULL,
	`attribute_count` integer NOT NULL,
	`total_before` real NOT NULL,
	`total_after` real NOT NULL,
	`savings` real NOT NULL,
	`savings_percent` real NOT NULL,
	`total_downtime_before` real NOT NULL,
	`total_downtime_after` real NOT NULL,
	`downtime_savings` real NOT NULL,
	`downtime_savings_percent` real NOT NULL,
	`attributes_json` text NOT NULL,
	`attribute_stats_json` text NOT NULL,
	`template_id` text,
	`run_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `optimization_runs_run_at_idx` ON `optimization_runs` (`run_at`);--> statement-breakpoint
CREATE INDEX `optimization_runs_template_id_idx` ON `optimization_runs` (`template_id`);