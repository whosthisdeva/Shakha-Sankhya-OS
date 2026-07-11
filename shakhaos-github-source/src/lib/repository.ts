import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { nowISO } from "./dates";
import { sampleAdmins, sampleAnnouncements, sampleAttendance, samplePeople, sampleQrCodes, sampleShakhas } from "./sampleData";
import type { AdminUser, Announcement, AttendanceRecord, Person, QrCodeRecord, Shakha } from "../types";

type WithoutId<T extends { id: string }> = Omit<T, "id">;

async function readCollection<T extends { id: string }>(name: string): Promise<T[]> {
  if (!db || !isFirebaseConfigured) return [] as T[];
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

async function upsertDocument<T extends { id: string }>(name: string, value: T) {
  if (!db || !isFirebaseConfigured) return value;
  const { id, ...rest } = value;
  await setDoc(doc(db, name, id), { ...rest, updatedAt: nowISO() }, { merge: true });
  return value;
}

async function createDocument<T extends { id: string }>(name: string, value: WithoutId<T>): Promise<T> {
  if (!db || !isFirebaseConfigured) return { id: crypto.randomUUID(), ...value } as T;
  const ref = await addDoc(collection(db, name), { ...value, createdAt: nowISO(), updatedAt: nowISO() });
  return { id: ref.id, ...value } as T;
}

export async function getShakhas() {
  const live = await readCollection<Shakha>("shakhas");
  return live.length ? live : sampleShakhas;
}

export async function saveShakha(shakha: Shakha) {
  return upsertDocument("shakhas", shakha);
}

export async function getPeople() {
  const live = await readCollection<Person>("people");
  return live.length ? live : samplePeople;
}

export async function savePerson(person: Person) {
  return upsertDocument("people", person);
}

export async function getAdmins() {
  const live = await readCollection<AdminUser>("admins");
  return live.length ? live : sampleAdmins;
}

export async function saveAdmin(admin: AdminUser) {
  return upsertDocument("admins", admin);
}

export async function getAttendance(shakhaId?: string) {
  if (!db || !isFirebaseConfigured) return sampleAttendance;
  const base = collection(db, "attendance");
  const q = shakhaId
    ? query(base, where("shakhaId", "==", shakhaId), orderBy("date", "desc"))
    : query(base, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AttendanceRecord);
}

export async function saveAttendance(record: AttendanceRecord) {
  return upsertDocument("attendance", record);
}

export async function getAnnouncements() {
  const live = await readCollection<Announcement>("announcements");
  return live.length ? live : sampleAnnouncements;
}

export async function saveAnnouncement(value: WithoutId<Announcement>) {
  return createDocument<Announcement>("announcements", value);
}

export async function getQrCodes() {
  const live = await readCollection<QrCodeRecord>("qrCodes");
  return live.length ? live : sampleQrCodes;
}

export async function saveQrCode(value: QrCodeRecord) {
  return upsertDocument("qrCodes", value);
}
