CREATE TABLE `app_state` (
	`id` text PRIMARY KEY NOT NULL,
	`last_viewed_schedule_id` text,
	`last_viewed_study_id` text,
	`license_key` text,
	`license_email` text,
	`license_activated_at` integer,
	`license_valid_until` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`order_id_column` text NOT NULL,
	`attributes_json` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `product_attributes` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`attribute_name` text NOT NULL,
	`attribute_value` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`family` text,
	`category` text,
	`standard_time_minutes` real,
	`pack_quantity` integer DEFAULT 1,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);