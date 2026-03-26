CREATE TABLE "activation_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'unused' NOT NULL,
	"expires_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"used_by_device_id" varchar(255),
	"validity_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activation_codes_status_check" CHECK ("activation_codes"."status" in ('unused', 'used')),
	CONSTRAINT "activation_codes_validity_days_check" CHECK ("activation_codes"."validity_days" is null or "activation_codes"."validity_days" > 0)
);
--> statement-breakpoint
CREATE TABLE "admin_login_guards" (
	"guard_key" varchar(128) PRIMARY KEY NOT NULL,
	"guard_type" varchar(20) NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"first_failed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_failed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_login_guards_guard_type_check" CHECK ("admin_login_guards"."guard_type" in ('username', 'ip')),
	CONSTRAINT "admin_login_guards_failed_count_check" CHECK ("admin_login_guards"."failed_count" >= 0),
	CONSTRAINT "admin_login_guards_locked_until_check" CHECK ("admin_login_guards"."locked_until" is null or "admin_login_guards"."locked_until" >= "admin_login_guards"."first_failed_at")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_activation_codes_code" ON "activation_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "activation_codes_code_unique_idx" ON "activation_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_activation_codes_status" ON "activation_codes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_activation_codes_expires_at" ON "activation_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_activation_codes_device_id" ON "activation_codes" USING btree ("used_by_device_id");--> statement-breakpoint
CREATE INDEX "idx_activation_codes_created_at" ON "activation_codes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activation_codes_validity_days" ON "activation_codes" USING btree ("validity_days");--> statement-breakpoint
CREATE INDEX "idx_admin_login_guards_type" ON "admin_login_guards" USING btree ("guard_type");--> statement-breakpoint
CREATE INDEX "idx_admin_login_guards_locked_until" ON "admin_login_guards" USING btree ("locked_until");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_username_unique" ON "admin_users" USING btree ("username");