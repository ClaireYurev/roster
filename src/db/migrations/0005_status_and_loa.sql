ALTER TABLE `employees` ADD `status` text NOT NULL DEFAULT 'ACTIVE';--> statement-breakpoint
UPDATE `employees` SET `status` = CASE WHEN `is_active` = 1 THEN 'ACTIVE' ELSE 'DISABLED_VOLUNTARY' END;--> statement-breakpoint
CREATE TABLE `loa_records` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `lifecycle_event_id` integer NOT NULL,
  `expected_end_date` integer,
  `pc_end_date_confirmed` integer DEFAULT false NOT NULL,
  `jumpcloud_suspended` integer DEFAULT false NOT NULL,
  `jumpcloud_activated` integer DEFAULT false NOT NULL,
  `actual_end_date` integer,
  `notes` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`lifecycle_event_id`) REFERENCES `lifecycle_events`(`id`) ON UPDATE no action ON DELETE no action
);
