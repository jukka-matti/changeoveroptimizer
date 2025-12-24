CREATE TABLE `smed_changeover_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`standard_id` text,
	`operator` text,
	`total_seconds` integer NOT NULL,
	`step_timings_json` text,
	`variance_seconds` integer,
	`variance_percent` real,
	`notes` text,
	`issues` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`study_id`) REFERENCES `smed_studies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`standard_id`) REFERENCES `smed_standards`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `smed_logs_study_id_idx` ON `smed_changeover_logs` (`study_id`);--> statement-breakpoint
CREATE INDEX `smed_logs_started_at_idx` ON `smed_changeover_logs` (`started_at`);--> statement-breakpoint
CREATE TABLE `smed_improvements` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`description` text NOT NULL,
	`improvement_type` text NOT NULL,
	`status` text DEFAULT 'idea' NOT NULL,
	`estimated_savings_seconds` integer,
	`actual_savings_seconds` integer,
	`estimated_cost` real,
	`actual_cost` real,
	`assigned_to` text,
	`due_date` integer,
	`completed_date` integer,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`study_id`) REFERENCES `smed_studies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `smed_improvements_study_id_idx` ON `smed_improvements` (`study_id`);--> statement-breakpoint
CREATE INDEX `smed_improvements_status_idx` ON `smed_improvements` (`status`);--> statement-breakpoint
CREATE TABLE `smed_standards` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`standard_time_minutes` real NOT NULL,
	`steps_json` text NOT NULL,
	`tools_required` text,
	`safety_precautions` text,
	`visual_aids_json` text,
	`is_active` integer DEFAULT true,
	`published_at` integer,
	`published_by` text,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`study_id`) REFERENCES `smed_studies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `smed_standards_study_id_idx` ON `smed_standards` (`study_id`);--> statement-breakpoint
CREATE INDEX `smed_standards_active_idx` ON `smed_standards` (`is_active`);--> statement-breakpoint
CREATE TABLE `smed_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`sequence_number` integer NOT NULL,
	`description` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`category` text NOT NULL,
	`operation_type` text NOT NULL,
	`notes` text,
	`video_timestamp` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`study_id`) REFERENCES `smed_studies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `smed_steps_study_id_idx` ON `smed_steps` (`study_id`);--> statement-breakpoint
CREATE INDEX `smed_steps_sequence_idx` ON `smed_steps` (`study_id`,`sequence_number`);--> statement-breakpoint
CREATE TABLE `smed_studies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`from_product_id` text,
	`to_product_id` text,
	`changeover_type` text,
	`line_name` text,
	`machine_name` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`baseline_minutes` real,
	`target_minutes` real,
	`current_minutes` real,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`from_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`to_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `smed_studies_status_idx` ON `smed_studies` (`status`);--> statement-breakpoint
CREATE INDEX `smed_studies_updated_at_idx` ON `smed_studies` (`updated_at`);