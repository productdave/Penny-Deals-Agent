ALTER TABLE `tracked_items` ADD `target_mode` text DEFAULT 'absolute' NOT NULL;--> statement-breakpoint
ALTER TABLE `tracked_items` ADD `target_percent` real;--> statement-breakpoint
ALTER TABLE `tracked_items` ADD `target_reference_price` real;
