import type { AdminUser, Role } from "../types";

/** Roles that must be scoped to a shakha. */
export function adminRequiresShakha(role: Role): boolean {
  return role === "shakhaAdmin" || role === "teacher" || role === "volunteer";
}

/** True when the signed-in user may use the app. */
export function isActiveAdminProfile(admin: AdminUser | null | undefined): boolean {
  return Boolean(admin?.active && admin.email);
}

/**
 * Validate admin form before save.
 * Returns an error message, or null when valid.
 */
export function validateAdminForm(input: {
  email?: string;
  role: Role;
  assignedShakhaId?: string;
}): string | null {
  const email = (input.email ?? "").trim().toLowerCase();
  if (!email) return "Email is required";
  if (!email.includes("@")) return "Email looks invalid";
  if (adminRequiresShakha(input.role) && !input.assignedShakhaId) {
    return "Assigned shakha is required for this role";
  }
  return null;
}

export type AdminWritePayload = {
  email: string;
  role: Role;
  active: boolean;
  /** Present string keeps assignment; null clears it in Firestore. */
  assignedShakhaId: string | null;
  assignedVibhag: string | null;
  uid?: string;
  createdAt: string;
};

/** Build a Firestore-safe admin payload (no `undefined` fields). */
export function prepareAdminWrite(
  admin: AdminUser,
  nowIso: string
): AdminWritePayload {
  const email = admin.email.trim().toLowerCase();
  if (!email) throw new Error("Admin email is required");

  const clearShakha = admin.role === "nationalAdmin" || !admin.assignedShakhaId;

  return {
    email,
    role: admin.role,
    active: admin.active !== false,
    assignedShakhaId: clearShakha ? null : admin.assignedShakhaId!,
    assignedVibhag: admin.assignedVibhag ? admin.assignedVibhag : null,
    uid: admin.uid,
    createdAt: admin.createdAt || nowIso
  };
}
