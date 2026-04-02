CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`current_name` text NOT NULL,
	`current_role` text NOT NULL,
	`current_department` text NOT NULL,
	`employment_type` text DEFAULT 'FTE' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`mailing_address` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hardware_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`system_name` text NOT NULL,
	`asset_tag` text,
	`model` text NOT NULL,
	`description` text,
	`cost` integer,
	`purchase_date` integer NOT NULL,
	`status` text DEFAULT 'UNASSIGNED' NOT NULL,
	`employee_id` text,
	`assigned_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hardware_assets_system_name_unique` ON `hardware_assets` (`system_name`);--> statement-breakpoint
CREATE TABLE `lifecycle_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` text NOT NULL,
	`event_type` text NOT NULL,
	`event_date` integer NOT NULL,
	`payload` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `onboarding_checklists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lifecycle_event_id` integer NOT NULL,
	`jumpcloud_provisioned` integer DEFAULT false NOT NULL,
	`laptop_assigned` integer DEFAULT false NOT NULL,
	`email_alias_created` integer DEFAULT false NOT NULL,
	`computer_type` text,
	`computer_size` text,
	`peripherals_notes` text,
	`additional_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lifecycle_event_id`) REFERENCES `lifecycle_events`(`id`) ON UPDATE no action ON DELETE no action
);
