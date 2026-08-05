export type Role = "nationalAdmin" | "vibhagAdmin" | "shakhaAdmin" | "teacher" | "volunteer";

export interface Shakha {
  id: string;
  name: string;
  vibhag: string;
  sambhag: string;
  location: string;
  meetingTime: string;
  type: string;
  karyawah: string;
  mukhyaShikshak: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  uid?: string;
  email: string;
  role: Role;
  assignedShakhaId?: string;
  assignedVibhag?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Category counts for one shakha on one day — primary Sampark feed. */
export interface SankhyaCounts {
  sevika: number;
  swayamSewak: number;
  shishu: number;
  balas: number;
  kishores: number;
  praudh: number;
  others: number;
}

export interface SankhyaEntry {
  id: string;
  shakhaId: string;
  shakhaName: string;
  date: string;
  counts: SankhyaCounts;
  notes: string;
  recordedBy: string;
  recordedAt?: string;
  updatedAt?: string;
}

export function emptyCounts(): SankhyaCounts {
  return {
    sevika: 0,
    swayamSewak: 0,
    shishu: 0,
    balas: 0,
    kishores: 0,
    praudh: 0,
    others: 0
  };
}

export function sankhyaTotal(counts: SankhyaCounts): number {
  return (
    counts.sevika +
    counts.swayamSewak +
    counts.shishu +
    counts.balas +
    counts.kishores +
    counts.praudh +
    counts.others
  );
}

export const SANKHYA_FIELDS: { key: keyof SankhyaCounts; label: string }[] = [
  { key: "sevika", label: "Sevika" },
  { key: "swayamSewak", label: "SwayamSewak" },
  { key: "shishu", label: "Shishu" },
  { key: "balas", label: "Bala" },
  { key: "kishores", label: "Kishores" },
  { key: "praudh", label: "Praudh" },
  { key: "others", label: "Others" }
];

export const NOTES_MAX = 500;

export function sankhyaDocId(shakhaId: string, date: string) {
  return `${shakhaId}_${date}`;
}
