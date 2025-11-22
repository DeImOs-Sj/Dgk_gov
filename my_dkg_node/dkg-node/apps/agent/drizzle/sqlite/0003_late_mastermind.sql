ALTER TABLE `users` RENAME COLUMN "username" TO "email";--> statement-breakpoint
DROP INDEX `users_username_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);