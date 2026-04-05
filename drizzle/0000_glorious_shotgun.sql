CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`sender` text NOT NULL,
	`text` text NOT NULL,
	`is_chip_active` integer DEFAULT false,
	`has_cards` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` text NOT NULL,
	`price` real NOT NULL,
	`source` text DEFAULT 'manual',
	`recorded_at` integer,
	FOREIGN KEY (`item_id`) REFERENCES `tracked_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tracked_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'Waiting for Deal' NOT NULL,
	`best_price` real NOT NULL,
	`target_price` real NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`created_at` integer
);
