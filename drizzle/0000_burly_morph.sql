CREATE TYPE "public"."diff_segment_type" AS ENUM('same', 'removed', 'added');--> statement-breakpoint
CREATE TYPE "public"."diff_side" AS ENUM('before', 'after');--> statement-breakpoint
CREATE TYPE "public"."effect_type" AS ENUM('اصلاح', 'افزوده', 'حذف', 'جایگزینی', 'الحاق', 'توضیح', 'اجرا', 'تفویض اختیار');--> statement-breakpoint
CREATE TYPE "public"."law_status" AS ENUM('in-force', 'amended', 'revoked', 'pending');--> statement-breakpoint
CREATE TYPE "public"."law_type" AS ENUM('قانون عادی', 'قانون اساسی', 'آیین‌نامه', 'بخشنامه', 'مقررات');--> statement-breakpoint
CREATE TYPE "public"."reference_direction" AS ENUM('cites', 'cited-by', 'amends', 'amended-by', 'related');--> statement-breakpoint
CREATE TYPE "public"."toc_node_type" AS ENUM('book', 'chapter', 'section', 'topic', 'part', 'schedule', 'note');--> statement-breakpoint
CREATE TABLE "laws" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"short_title" text,
	"type" "law_type" NOT NULL,
	"year" integer NOT NULL,
	"number" text,
	"status" "law_status" DEFAULT 'in-force' NOT NULL,
	"extent" text NOT NULL,
	"subject" text NOT NULL,
	"promulgating_authority" text NOT NULL,
	"approved_date" text NOT NULL,
	"effective_date" text NOT NULL,
	"last_revision_date" text NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"original_approved_date" text,
	"original_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "toc_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"law_id" text NOT NULL,
	"parent_id" text,
	"type" "toc_node_type" NOT NULL,
	"label" text NOT NULL,
	"title" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"law_id" text NOT NULL,
	"toc_node_id" text,
	"number" text NOT NULL,
	"title" text,
	"text" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commentary_items" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"marker" text NOT NULL,
	"effect_type" "effect_type" NOT NULL,
	"date" text NOT NULL,
	"affecting_law_id" text,
	"affecting_law_title" text NOT NULL,
	"affecting_law_year" integer NOT NULL,
	"affecting_law_number" text,
	"affecting_law_provision_label" text,
	"text" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amendments" (
	"id" text PRIMARY KEY NOT NULL,
	"law_id" text NOT NULL,
	"date" text NOT NULL,
	"date_label" text NOT NULL,
	"effect_type" "effect_type" NOT NULL,
	"affected_provision" text NOT NULL,
	"affected_provision_id" text,
	"affecting_law_id" text,
	"affecting_law_title" text NOT NULL,
	"affecting_law_year" integer NOT NULL,
	"affecting_law_number" text,
	"affecting_law_provision_label" text,
	"description" text NOT NULL,
	"applied_to_text" boolean DEFAULT false NOT NULL,
	"note" text,
	"before_text" text,
	"after_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diff_segments" (
	"id" text PRIMARY KEY NOT NULL,
	"amendment_id" text NOT NULL,
	"segment_type" "diff_segment_type" NOT NULL,
	"text" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outstanding_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"law_id" text NOT NULL,
	"affected_provision" text NOT NULL,
	"effect_type" "effect_type" NOT NULL,
	"affecting_law_id" text,
	"affecting_law_title" text NOT NULL,
	"affecting_law_year" integer NOT NULL,
	"affecting_law_number" text,
	"description" text NOT NULL,
	"expected_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "references" (
	"id" text PRIMARY KEY NOT NULL,
	"source_law_id" text NOT NULL,
	"target_law_id" text,
	"direction" "reference_direction" NOT NULL,
	"target_title" text NOT NULL,
	"target_year" integer NOT NULL,
	"target_number" text,
	"target_provision_label" text,
	"source_provision" text,
	"target_provision" text,
	"context" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "toc_nodes" ADD CONSTRAINT "toc_nodes_law_id_laws_id_fk" FOREIGN KEY ("law_id") REFERENCES "public"."laws"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "toc_nodes" ADD CONSTRAINT "toc_nodes_parent_id_toc_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."toc_nodes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_law_id_laws_id_fk" FOREIGN KEY ("law_id") REFERENCES "public"."laws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_toc_node_id_toc_nodes_id_fk" FOREIGN KEY ("toc_node_id") REFERENCES "public"."toc_nodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentary_items" ADD CONSTRAINT "commentary_items_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentary_items" ADD CONSTRAINT "commentary_items_affecting_law_id_laws_id_fk" FOREIGN KEY ("affecting_law_id") REFERENCES "public"."laws"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_law_id_laws_id_fk" FOREIGN KEY ("law_id") REFERENCES "public"."laws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_affected_provision_id_articles_id_fk" FOREIGN KEY ("affected_provision_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_affecting_law_id_laws_id_fk" FOREIGN KEY ("affecting_law_id") REFERENCES "public"."laws"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diff_segments" ADD CONSTRAINT "diff_segments_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "public"."amendments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outstanding_changes" ADD CONSTRAINT "outstanding_changes_law_id_laws_id_fk" FOREIGN KEY ("law_id") REFERENCES "public"."laws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outstanding_changes" ADD CONSTRAINT "outstanding_changes_affecting_law_id_laws_id_fk" FOREIGN KEY ("affecting_law_id") REFERENCES "public"."laws"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_source_law_id_laws_id_fk" FOREIGN KEY ("source_law_id") REFERENCES "public"."laws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_target_law_id_laws_id_fk" FOREIGN KEY ("target_law_id") REFERENCES "public"."laws"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;