CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`url` text,
	`industry` varchar(100),
	`employeeCount` int,
	`challenges` text,
	`reasons` text,
	`effects` text,
	`fullText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
