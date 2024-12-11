PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_CustomFieldEntry` (
	`id` integer PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`custom_field_id` integer NOT NULL,
	`entry_id` integer NOT NULL,
	`value` text,
	FOREIGN KEY (`custom_field_id`) REFERENCES `CustomField`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entry_id`) REFERENCES `Entry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_CustomFieldEntry`("id", "createdAt", "updatedAt", "custom_field_id", "entry_id", "value") SELECT "id", "createdAt", "updatedAt", "custom_field_id", "entry_id", "value" FROM `CustomFieldEntry`;--> statement-breakpoint
DROP TABLE `CustomFieldEntry`;--> statement-breakpoint
ALTER TABLE `__new_CustomFieldEntry` RENAME TO `CustomFieldEntry`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_CustomField` (
	`id` integer PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`id_name` text NOT NULL,
	`data_type` text NOT NULL,
	`label` text NOT NULL,
	`ai_description` text,
	`description` text,
	`autocomplete_enabled` integer DEFAULT true NOT NULL,
	`is_disabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_CustomField`("id", "createdAt", "updatedAt", "id_name", "data_type", "label", "ai_description", "description", "autocomplete_enabled", "is_disabled") SELECT "id", "createdAt", "updatedAt", "id_name", "data_type", "label", "ai_description", "description", "autocomplete_enabled", "is_disabled" FROM `CustomField`;--> statement-breakpoint
DROP TABLE `CustomField`;--> statement-breakpoint
ALTER TABLE `__new_CustomField` RENAME TO `CustomField`;--> statement-breakpoint
CREATE UNIQUE INDEX `CustomField_id_name_unique` ON `CustomField` (`id_name`);--> statement-breakpoint
CREATE TABLE `__new_Entry` (
	`id` integer PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`nct_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`notes` text,
	`raw_json` text,
	`history` text
);
--> statement-breakpoint
INSERT INTO `__new_Entry`("id", "createdAt", "updatedAt", "nct_id", "title", "description", "notes", "raw_json", "history") SELECT "id", "createdAt", "updatedAt", "nct_id", "title", "description", "notes", "raw_json", "history" FROM `Entry`;--> statement-breakpoint
DROP TABLE `Entry`;--> statement-breakpoint
ALTER TABLE `__new_Entry` RENAME TO `Entry`;--> statement-breakpoint
CREATE TABLE `__new_PersistentZustand` (
	`id` integer PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`name` text NOT NULL,
	`data` text
);
--> statement-breakpoint
INSERT INTO `__new_PersistentZustand`("id", "createdAt", "updatedAt", "name", "data") SELECT "id", "createdAt", "updatedAt", "name", "data" FROM `PersistentZustand`;--> statement-breakpoint
DROP TABLE `PersistentZustand`;--> statement-breakpoint
ALTER TABLE `__new_PersistentZustand` RENAME TO `PersistentZustand`;--> statement-breakpoint
CREATE UNIQUE INDEX `PersistentZustand_name_unique` ON `PersistentZustand` (`name`);