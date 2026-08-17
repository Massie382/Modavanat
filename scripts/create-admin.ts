/**
 * Bootstrap admin — creates the first admin user so you can log in
 * to the /admin panel for the first time.
 *
 * Usage:
 *   bun run scripts/create-admin.ts <email> [name] [--password <pw>]
 *
 * Examples:
 *   # Interactive (prompts for password):
 *   bun run scripts/create-admin.ts admin@modavanat.ir "نام مدیر"
 *
 *   # Non-interactive (for automation):
 *   bun run scripts/create-admin.ts admin@modavanat.ir "نام مدیر" --password 'S3cret!'
 *
 *   # With super-admin role:
 *   bun run scripts/create-admin.ts admin@modavanat.ir "نام مدیر" --role super-admin --password 'S3cret!'
 *
 * Behavior:
 *   - If email already exists: updates name/role/password (idempotent),
 *     so this script is safe to re-run on an existing admin.
 *   - If email is new: creates a user row with role='admin' (or
 *     whatever --role specifies) and the password hashed via scrypt.
 *   - Generates a CUID-style id via crypto.randomUUID() (good enough
 *     for our purposes; not a true cuid but unique + URL-safe).
 *   - Prints a confirmation message with the user's email + role.
 */

import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth/passwords";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

interface Args {
  email: string;
  name?: string;
  password?: string;
  role: string;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let password: string | undefined;
  let role = "admin";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--password") {
      password = argv[++i];
    } else if (a === "--role") {
      role = argv[++i];
    } else if (a.startsWith("--password=")) {
      password = a.slice("--password=".length);
    } else if (a.startsWith("--role=")) {
      role = a.slice("--role=".length);
    } else if (!a.startsWith("--")) {
      positional.push(a);
    }
  }
  const email = positional[0];
  const name = positional[1];
  if (!email) {
    console.error(
      "Usage: bun run scripts/create-admin.ts <email> [name] [--password <pw>] [--role admin|super-admin]"
    );
    process.exit(2);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Invalid email: "${email}"`);
    process.exit(2);
  }
  if (role !== "admin" && role !== "super-admin" && role !== "user") {
    console.error(`Invalid role: "${role}" — must be admin, super-admin, or user`);
    process.exit(2);
  }
  return { email: email.toLowerCase(), name, password, role };
}

async function promptPassword(): Promise<string> {
  const rl = readline.createInterface({ input, output });
  // We don't disable TTY echo here for portability — in most terminals
  // the password will be visible while typing. If you need hidden
  // input, run with --password <pw> instead.
  const pw = await rl.question("Enter password (>= 8 chars): ");
  rl.close();
  if (pw.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  return pw;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const password = args.password ?? (await promptPassword());

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, args.email))
    .limit(1);

  if (existing.length > 0) {
    const user = existing[0];
    console.log(`Updating existing user ${args.email}…`);
    await db
      .update(users)
      .set({
        name: args.name ?? user.name,
        role: args.role,
        passwordHash: hashPassword(password),
        emailVerified: user.emailVerified ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    console.log(
      `✓ Updated user "${args.email}" — name="${args.name ?? user.name}", role="${args.role}"`
    );
  } else {
    const id = randomUUID();
    await db.insert(users).values({
      id,
      name: args.name,
      email: args.email,
      role: args.role,
      passwordHash: hashPassword(password),
      emailVerified: new Date(),
    });
    console.log(
      `✓ Created user "${args.email}" — name="${args.name ?? "(none)"}", role="${args.role}"`
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
