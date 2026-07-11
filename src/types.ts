export type Role = "nationalAdmin" | "vibhagAdmin" | "shakhaAdmin" | "teacher" | "volunteer";

export type Gender = "Female" | "Male" | "Other" | "Prefer not to say";

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

export interface Person {
  id: string;
  name: string;
  position: string;
  assignedShakhaId: string;
  gender: Gender;
  location: string;
  email: string;
  active: boolean;
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

export interface AttendanceRecord {
  id: string;
  date: string;
  shakhaId: string;
  memberId: string;
  memberName: string;
  present: boolean;
  timeRecorded: string;
  recordedBy: string;
  location: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "All" | "National" | "Vibhag" | "Shakha";
  shakhaId?: string;
  vibhag?: string;
  createdBy: string;
  createdAt: string;
}

export interface QrCodeRecord {
  id: string;
  shakhaId: string;
  shakhaName: string;
  payload: string;
  generatedDate: string;
  generatedBy: string;
}

export interface ReportSummary {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  attendanceThisWeek: number;
  attendanceThisMonth: number;
}
