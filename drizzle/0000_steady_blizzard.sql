CREATE TABLE `CustomFieldEntry` (
	`id` integer PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT '"2024-12-02T19:27:04.456Z"' NOT NULL,
	`updatedAt` integer DEFAULT '"2024-12-02T19:27:04.456Z"' NOT NULL,
	`custom_field_id` integer NOT NULL,
	`entry_id` integer NOT NULL,
	`value` text,
	FOREIGN KEY (`custom_field_id`) REFERENCES `CustomField`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entry_id`) REFERENCES `Entry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `CustomField` (
	`id` integer PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT '"2024-12-02T19:27:04.456Z"' NOT NULL,
	`updatedAt` integer DEFAULT '"2024-12-02T19:27:04.456Z"' NOT NULL,
	`id_name` text NOT NULL,
	`data_type` text NOT NULL,
	`label` text NOT NULL,
	`ai_description` text,
	`description` text,
	`is_disabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Entry` (
	`id` integer PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT '"2024-12-02T19:27:04.456Z"' NOT NULL,
	`updatedAt` integer DEFAULT '"2024-12-02T19:27:04.456Z"' NOT NULL,
	`nct_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`notes` text,
	`raw_json` text,
	`history` text
);
--> statement-breakpoint
CREATE TABLE `PersistentZustand` (
	`id` integer PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT '"2024-12-02T19:27:04.456Z"' NOT NULL,
	`updatedAt` integer DEFAULT '"2024-12-02T19:27:04.456Z"' NOT NULL,
	`name` text NOT NULL,
	`data` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `CustomField_id_name_unique` ON `CustomField` (`id_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `PersistentZustand_name_unique` ON `PersistentZustand` (`name`);