import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where
} from "firebase/firestore";
import { db } from "./firebase";
import { nowISO } from "./dates";
import { prepareAdminWrite } from "./adminAccess";
import {
  emptyCounts,
  sankhyaDocId,
  type AdminUser,
  type SankhyaCounts,
  type SankhyaEntry,
  type Shakha
} from "../types";

function requireDb() {
  if (!db) throw new Error("Firebase is not configured");
  return db;
}

function clampCount(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function readCounts(value: unknown): SankhyaCounts {
  const raw = (value ?? {}) as Partial<SankhyaCounts>;
  return {
    sevika: clampCount(raw.sevika),
    swayamSewak: clampCount(raw.swayamSewak),
    shishu: clampCount(raw.shishu),
    balas: clampCount(raw.balas),
    kishores: clampCount(raw.kishores),
    praudh: clampCount(raw.praudh),
    others: clampCount(raw.others)
  };
}

function mapSankhya(id: string, data: Record<string, unknown>): SankhyaEntry {
  return {
    id,
    shakhaId: String(data.shakhaId ?? ""),
    shakhaName: String(data.shakhaName ?? ""),
    date: String(data.date ?? ""),
    counts: readCounts(data.counts),
    notes: String(data.notes ?? "").slice(0, 500),
    recordedBy: String(data.recordedBy ?? ""),
    recordedAt: data.recordedAt ? String(data.recordedAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined
  };
}

/* -------------------------------- Shakhas -------------------------------- */

export async function listShakhas(): Promise<Shakha[]> {
  const snap = await getDocs(collection(requireDb(), "shakhas"));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Shakha);
}

export async function saveShakha(shakha: Shakha): Promise<Shakha> {
  const { id, ...rest } = shakha;
  await setDoc(doc(requireDb(), "shakhas", id), { ...rest, updatedAt: nowISO() }, { merge: true });
  return shakha;
}

/* -------------------------------- Admins --------------------------------- */

export async function listAdmins(): Promise<AdminUser[]> {
  const snap = await getDocs(collection(requireDb(), "admins"));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as AdminUser);
}

export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  const id = email.trim().toLowerCase();
  if (!id) return null;
  const snap = await getDoc(doc(requireDb(), "admins", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AdminUser;
}

export async function saveAdmin(admin: AdminUser): Promise<AdminUser> {
  const stamp = nowISO();
  const prepared = prepareAdminWrite(admin, stamp);
  const payload: Record<string, unknown> = {
    email: prepared.email,
    role: prepared.role,
    active: prepared.active,
    createdAt: prepared.createdAt,
    updatedAt: stamp,
    assignedShakhaId: prepared.assignedShakhaId === null ? deleteField() : prepared.assignedShakhaId,
    assignedVibhag: prepared.assignedVibhag === null ? deleteField() : prepared.assignedVibhag
  };
  if (prepared.uid) payload.uid = prepared.uid;

  await setDoc(doc(requireDb(), "admins", prepared.email), payload, { merge: true });
  return {
    ...admin,
    id: prepared.email,
    email: prepared.email,
    active: prepared.active,
    assignedShakhaId: prepared.assignedShakhaId || undefined,
    assignedVibhag: prepared.assignedVibhag || undefined
  };
}

export async function deleteAdmin(email: string): Promise<void> {
  const id = email.trim().toLowerCase();
  if (!id) throw new Error("Admin email is required");
  await deleteDoc(doc(requireDb(), "admins", id));
}

/* -------------------------------- Sankhya -------------------------------- */

export async function getSankhya(shakhaId: string, date: string): Promise<SankhyaEntry | null> {
  const id = sankhyaDocId(shakhaId, date);
  const snap = await getDoc(doc(requireDb(), "sankhya", id));
  if (!snap.exists()) return null;
  return mapSankhya(snap.id, snap.data());
}

export async function listSankhya(range?: { from?: string; to?: string; shakhaId?: string }): Promise<SankhyaEntry[]> {
  const firestore = requireDb();
  const constraints = [] as ReturnType<typeof where>[];
  if (range?.shakhaId) constraints.push(where("shakhaId", "==", range.shakhaId));
  if (range?.from) constraints.push(where("date", ">=", range.from));
  if (range?.to) constraints.push(where("date", "<=", range.to));

  const q =
    constraints.length > 0
      ? query(collection(firestore, "sankhya"), ...constraints, orderBy("date", "desc"))
      : query(collection(firestore, "sankhya"), orderBy("date", "desc"));

  const snap = await getDocs(q);
  return snap.docs.map((item) => mapSankhya(item.id, item.data()));
}

export async function saveSankhya(input: {
  shakhaId: string;
  shakhaName: string;
  date: string;
  counts: SankhyaCounts;
  notes: string;
  recordedBy: string;
}): Promise<SankhyaEntry> {
  const id = sankhyaDocId(input.shakhaId, input.date);
  const existing = await getDoc(doc(requireDb(), "sankhya", id));
  const stamp = nowISO();
  const counts = readCounts(input.counts);
  const payload = {
    shakhaId: input.shakhaId,
    shakhaName: input.shakhaName,
    date: input.date,
    counts,
    notes: input.notes.trim().slice(0, 500),
    recordedBy: input.recordedBy,
    recordedAt: existing.exists() ? (existing.data().recordedAt ?? stamp) : stamp,
    updatedAt: stamp
  };
  await setDoc(doc(requireDb(), "sankhya", id), payload, { merge: true });
  return mapSankhya(id, payload);
}

export { emptyCounts };
