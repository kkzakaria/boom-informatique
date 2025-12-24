CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`title` text,
	`content` text,
	`is_verified_purchase` integer DEFAULT false,
	`is_approved` integer DEFAULT true,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
