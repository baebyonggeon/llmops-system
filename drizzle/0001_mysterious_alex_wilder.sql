CREATE TABLE `anomalyDetections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`anomalyId` varchar(128) NOT NULL,
	`deploymentId` int NOT NULL,
	`anomalyType` varchar(100),
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`description` text,
	`detectedAt` timestamp DEFAULT (now()),
	`status` enum('detected','investigating','resolved') DEFAULT 'detected',
	`resolution` text,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anomalyDetections_id` PRIMARY KEY(`id`),
	CONSTRAINT `anomalyDetections_anomalyId_unique` UNIQUE(`anomalyId`)
);
--> statement-breakpoint
CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` varchar(128) NOT NULL,
	`apiId` int NOT NULL,
	`keyName` varchar(255) NOT NULL,
	`keyValue` varchar(255) NOT NULL,
	`expiryDate` timestamp,
	`usageLimit` int,
	`usageCount` int DEFAULT 0,
	`status` enum('active','inactive','expired') DEFAULT 'active',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_apiKeyId_unique` UNIQUE(`apiKeyId`),
	CONSTRAINT `apiKeys_keyValue_unique` UNIQUE(`keyValue`)
);
--> statement-breakpoint
CREATE TABLE `apis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiId` varchar(128) NOT NULL,
	`apiName` varchar(255) NOT NULL,
	`description` text,
	`endpoint` varchar(500),
	`deploymentId` int,
	`status` enum('active','inactive') DEFAULT 'active',
	`callCount` int DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apis_id` PRIMARY KEY(`id`),
	CONSTRAINT `apis_apiId_unique` UNIQUE(`apiId`)
);
--> statement-breakpoint
CREATE TABLE `deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deploymentId` varchar(128) NOT NULL,
	`modelId` int NOT NULL,
	`imageId` int NOT NULL,
	`deploymentName` varchar(255),
	`tensorParallelSize` int,
	`maxModelLen` int,
	`gpuMemoryUtilization` decimal(3,2),
	`resourceGroupId` varchar(128),
	`resourcePreset` varchar(100),
	`status` enum('pending','running','completed','failed') DEFAULT 'pending',
	`callCount` int DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployments_id` PRIMARY KEY(`id`),
	CONSTRAINT `deployments_deploymentId_unique` UNIQUE(`deploymentId`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` varchar(128) NOT NULL,
	`modelId` int NOT NULL,
	`evaluationName` varchar(255),
	`evaluationType` varchar(100),
	`status` enum('pending','in_progress','completed','failed') DEFAULT 'pending',
	`qualityScore` decimal(5,2),
	`evaluationData` text,
	`resultSummary` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`),
	CONSTRAINT `evaluations_evaluationId_unique` UNIQUE(`evaluationId`)
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageId` varchar(128) NOT NULL,
	`imageName` varchar(255) NOT NULL,
	`releaseDate` timestamp,
	`description` text,
	`imageSizeGB` int,
	`imageType` enum('training','inference') NOT NULL,
	`registryHost` varchar(255),
	`registryTag` varchar(100),
	`registryProject` varchar(100),
	`registryImageTag` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `images_id` PRIMARY KEY(`id`),
	CONSTRAINT `images_imageId_unique` UNIQUE(`imageId`)
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelId` varchar(128) NOT NULL,
	`modelName` varchar(255) NOT NULL,
	`releaseDate` timestamp,
	`description` text,
	`contextLength` varchar(50),
	`parameters` varchar(100),
	`cpuRequired` int,
	`memoryRequired` int,
	`gpuRequired` int,
	`gpuMemoryRequired` int,
	`modelIcon` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `models_id` PRIMARY KEY(`id`),
	CONSTRAINT `models_modelId_unique` UNIQUE(`modelId`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(128) NOT NULL,
	`projectName` varchar(255) NOT NULL,
	`description` text,
	`adminId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`isCreated` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `resourceGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceGroupId` varchar(128) NOT NULL,
	`groupName` varchar(255) NOT NULL,
	`description` text,
	`totalGPU` int,
	`totalCPU` int,
	`totalMemoryGB` int,
	`usedGPU` int DEFAULT 0,
	`usedCPU` int DEFAULT 0,
	`usedMemoryGB` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resourceGroups_id` PRIMARY KEY(`id`),
	CONSTRAINT `resourceGroups_resourceGroupId_unique` UNIQUE(`resourceGroupId`)
);
--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` varchar(128) NOT NULL,
	`baseModelId` int NOT NULL,
	`trainingName` varchar(255),
	`modelType` varchar(100),
	`trainingObjective` varchar(100),
	`schedule` enum('immediate','scheduled') DEFAULT 'immediate',
	`scheduledTime` timestamp,
	`trainingDataIds` text,
	`batchSize` int,
	`learningRate` decimal(8,6),
	`epochs` int,
	`earlyStopping` boolean DEFAULT false,
	`earlyStoppingPatience` int,
	`loraAlpha` int,
	`loraR` int,
	`loraTargetModules` text,
	`loraDropout` decimal(3,2),
	`fp16Optimizer` boolean DEFAULT false,
	`resourceGroupId` varchar(128),
	`resourcePreset` varchar(100),
	`estimatedTrainingTime` int,
	`status` enum('pending','running','completed','failed') DEFAULT 'pending',
	`gpuUsage` decimal(5,2),
	`loss` decimal(10,6),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trainings_id` PRIMARY KEY(`id`),
	CONSTRAINT `trainings_trainingId_unique` UNIQUE(`trainingId`)
);
