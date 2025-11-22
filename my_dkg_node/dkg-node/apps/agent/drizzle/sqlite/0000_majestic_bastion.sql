CREATE TABLE `oauth_clients` (
	`client_id` text PRIMARY KEY NOT NULL,
	`client_info` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `oauth_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`client_info` text NOT NULL,
	`params` text NOT NULL,
	`confirmed` text DEFAULT '',
	FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `oauth_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`scope` text NOT NULL,
	`resource` text,
	`extra` text,
	FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON UPDATE no action ON DELETE no action
);
