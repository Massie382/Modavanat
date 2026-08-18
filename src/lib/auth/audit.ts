/**
 * Audit log helper — appends a row to `audit_log` for any
 * security-relevant action (login success/failure, signup, password
 * reset, admin mutations).
 *
 * Best-effort: failures in the audit log insert are swallowed (the
 * action being audited should not fail because the audit row couldn't
 * be written). Use the `logAudit` async wrapper — it never throws.
 */

import { db } from "@/db/client";
import { auditLog } from "@/db/schema";

export interface AuditInput {
  actorUserId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? null,
      ip: input.ip ?? null,
    });
  } catch (err) {
    // Swallow — audit failure must not break the action being audited.
    console.error("[audit] Failed to write audit log:", err);
  }
}

/**
 * Convenience: log an anonymous/system action.
 */
export async function logSystemAction(
  action: string,
  extra: Partial<AuditInput> = {}
): Promise<void> {
  await logAudit({ ...extra, actorUserId: null, action });
}
