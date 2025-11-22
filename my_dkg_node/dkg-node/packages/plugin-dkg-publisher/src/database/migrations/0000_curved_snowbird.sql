CREATE TABLE `assets` (
	`id` char(36) NOT NULL,
	`batch_id` char(36),
	`content_hash` varchar(64) NOT NULL,
	`content_url` text NOT NULL,
	`content_size` bigint NOT NULL,
	`external_id` varchar(255),
	`external_source` varchar(100),
	`source_type` varchar(50),
	`source_reference` text,
	`asset_type` varchar(50),
	`priority` int DEFAULT 50,
	`status` enum('pending','processing','published','failed') NOT NULL DEFAULT 'pending',
	`status_message` text,
	`attempt_count` int DEFAULT 0,
	`max_attempts` int DEFAULT 3,
	`privacy` enum('private','public') DEFAULT 'private',
	`epochs` int DEFAULT 2,
	`replications` int DEFAULT 1,
	`ual` varchar(255),
	`transaction_hash` varchar(66),
	`blockchain` varchar(50),
	`published_at` timestamp,
	`next_retry_at` timestamp,
	`last_error` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_content_hash_unique` UNIQUE(`content_hash`),
	CONSTRAINT `assets_ual_unique` UNIQUE(`ual`)
);
--> statement-breakpoint
CREATE TABLE `batches` (
	`id` char(36) NOT NULL,
	`batch_name` varchar(255),
	`source` varchar(100),
	`total_assets` int NOT NULL DEFAULT 0,
	`pending_count` int NOT NULL DEFAULT 0,
	`processing_count` int NOT NULL DEFAULT 0,
	`published_count` int NOT NULL DEFAULT 0,
	`failed_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metrics_hourly` (
	`hour_timestamp` timestamp NOT NULL,
	`assets_registered` int DEFAULT 0,
	`assets_published` int DEFAULT 0,
	`assets_failed` int DEFAULT 0,
	`avg_publish_duration_seconds` int,
	`total_gas_used` bigint,
	`unique_wallets_used` int,
	CONSTRAINT `metrics_hourly_hour_timestamp` PRIMARY KEY(`hour_timestamp`)
);
--> statement-breakpoint
CREATE TABLE `publishing_attempts` (
	`id` char(36) NOT NULL,
	`asset_id` char(36) NOT NULL,
	`attempt_number` int NOT NULL,
	`worker_id` varchar(100),
	`wallet_address` varchar(42) NOT NULL,
	`wallet_id` char(36),
	`otnode_url` text,
	`blockchain` varchar(50),
	`transaction_hash` varchar(66),
	`gas_used` bigint,
	`status` enum('started','success','failed','timeout') NOT NULL,
	`ual` varchar(255),
	`error_type` varchar(50),
	`error_message` text,
	`started_at` timestamp NOT NULL,
	`completed_at` timestamp,
	`duration_seconds` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `publishing_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_metrics` (
	`wallet_id` char(36) NOT NULL,
	`date` timestamp NOT NULL,
	`total_publishes` int DEFAULT 0,
	`successful_publishes` int DEFAULT 0,
	`failed_publishes` int DEFAULT 0,
	`avg_duration_seconds` int,
	`total_gas_used` bigint,
	CONSTRAINT `wallet_metrics_wallet_id_date_pk` PRIMARY KEY(`wallet_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` char(36) NOT NULL,
	`address` varchar(42) NOT NULL,
	`private_key_encrypted` text NOT NULL,
	`blockchain` varchar(50) NOT NULL,
	`is_active` boolean DEFAULT true,
	`is_locked` boolean DEFAULT false,
	`locked_by` varchar(100),
	`locked_at` timestamp,
	`last_used_at` timestamp,
	`total_uses` int DEFAULT 0,
	`successful_uses` int DEFAULT 0,
	`failed_uses` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_address_unique` UNIQUE(`address`)
);
--> statement-breakpoint
CREATE INDEX `idx_status` ON `assets` (`status`);--> statement-breakpoint
CREATE INDEX `idx_retry` ON `assets` (`status`,`next_retry_at`);--> statement-breakpoint
CREATE INDEX `idx_source` ON `assets` (`external_source`,`external_id`);--> statement-breakpoint
CREATE INDEX `idx_pending` ON `assets` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_content_hash` ON `assets` (`content_hash`);--> statement-breakpoint
CREATE INDEX `idx_batch` ON `assets` (`batch_id`);--> statement-breakpoint
CREATE INDEX `idx_batch_status` ON `batches` (`created_at`,`completed_at`);--> statement-breakpoint
CREATE INDEX `idx_metrics_hour` ON `metrics_hourly` (`hour_timestamp`);--> statement-breakpoint
CREATE INDEX `idx_asset_attempts` ON `publishing_attempts` (`asset_id`,`attempt_number`);--> statement-breakpoint
CREATE INDEX `idx_wallet_usage` ON `publishing_attempts` (`wallet_address`,`started_at`);--> statement-breakpoint
CREATE INDEX `idx_available` ON `wallets` (`is_active`,`is_locked`,`last_used_at`);--> statement-breakpoint
ALTER TABLE `publishing_attempts` ADD CONSTRAINT `publishing_attempts_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publishing_attempts` ADD CONSTRAINT `publishing_attempts_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_metrics` ADD CONSTRAINT `wallet_metrics_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE cascade ON UPDATE no action;