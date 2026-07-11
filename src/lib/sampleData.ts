import type { AdminUser, Announcement, AttendanceRecord, Person, QrCodeRecord, Shakha } from "../types";

export const sampleShakhas: Shakha[] = [
  {
    id: "aryabhatta",
    name: "Aryabhatta",
    vibhag: "Alameda",
    sambhag: "CP",
    location: "Fremont",
    meetingTime: "4:00-5:30 PM",
    type: "Kishore",
    karyawah: "Saanvi",
    mukhyaShikshak: "Eva"
  },
  {
    id: "vivekananda",
    name: "Vivekananda",
    vibhag: "Santa Clara",
    sambhag: "CP",
    location: "San Jose",
    meetingTime: "9:00-10:30 AM",
    type: "Balagokulam",
    karyawah: "Maya",
    mukhyaShikshak: "Arjun"
  }
];

export const samplePeople: Person[] = [
  {
    id: "eva-garg",
    name: "Eva Garg",
    position: "Mukhya Shikshak",
    assignedShakhaId: "aryabhatta",
    gender: "Female",
    location: "Irvington",
    email: "eva@example.com",
    active: true
  },
  {
    id: "saanvi",
    name: "Saanvi",
    position: "Karyawah",
    assignedShakhaId: "aryabhatta",
    gender: "Female",
    location: "Fremont",
    email: "saanvi@example.com",
    active: true
  }
];

export const sampleAdmins: AdminUser[] = [
  {
    id: "admin-eva",
    email: "eva@example.com",
    role: "shakhaAdmin",
    assignedShakhaId: "aryabhatta",
    active: true
  }
];

export const sampleAttendance: AttendanceRecord[] = [
  {
    id: "sample-1",
    date: new Date().toISOString().slice(0, 10),
    shakhaId: "aryabhatta",
    memberId: "eva-garg",
    memberName: "Eva Garg",
    present: true,
    timeRecorded: "5:30 PM",
    recordedBy: "demo",
    location: "Irvington"
  }
];

export const sampleAnnouncements: Announcement[] = [
  {
    id: "camp",
    title: "Summer camp planning meeting",
    body: "Volunteer meeting this Sunday after shakha.",
    audience: "Shakha",
    shakhaId: "aryabhatta",
    createdBy: "demo",
    createdAt: new Date().toISOString()
  }
];

export const sampleQrCodes: QrCodeRecord[] = [];
