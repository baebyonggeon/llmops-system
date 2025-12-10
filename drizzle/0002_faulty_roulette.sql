CREATE TABLE `alertConditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conditionId` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`trainingId` int,
	`conditionType` enum('loss_threshold','accuracy_target','training_completed','training_failed') NOT NULL,
	`threshold` decimal(10,4),
	`operator` enum('less_than','greater_than','equal','less_equal','greater_equal'),
	`isActive` boolean DEFAULT true,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertConditions_id` PRIMARY KEY(`id`),
	CONSTRAINT `alertConditions_conditionId_unique` UNIQUE(`conditionId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`trainingId` int,
	`notificationType` enum('training_completed','loss_threshold','accuracy_target','training_failed','training_started','custom') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`severity` enum('info','warning','error','success') DEFAULT 'info',
	`isRead` boolean DEFAULT false,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_notificationId_unique` UNIQUE(`notificationId`)
);
