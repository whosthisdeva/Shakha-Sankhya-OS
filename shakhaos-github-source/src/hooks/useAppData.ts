import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdmins,
  getAnnouncements,
  getAttendance,
  getPeople,
  getQrCodes,
  getShakhas,
  saveAdmin,
  saveAnnouncement,
  saveAttendance,
  savePerson,
  saveQrCode,
  saveShakha
} from "../lib/repository";
import { daysAgoISO } from "../lib/dates";
import type { AdminUser, Announcement, AttendanceRecord, Person, QrCodeRecord, ReportSummary, Shakha } from "../types";

export function useAppData() {
  const [shakhas, setShakhas] = useState<Shakha[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [nextShakhas, nextPeople, nextAdmins, nextAttendance, nextAnnouncements, nextQrCodes] = await Promise.all([
      getShakhas(),
      getPeople(),
      getAdmins(),
      getAttendance(),
      getAnnouncements(),
      getQrCodes()
    ]);
    setShakhas(nextShakhas);
    setPeople(nextPeople);
    setAdmins(nextAdmins);
    setAttendance(nextAttendance);
    setAnnouncements(nextAnnouncements);
    setQrCodes(nextQrCodes);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo<ReportSummary>(() => {
    const weekStart = daysAgoISO(7);
    const monthStart = daysAgoISO(30);
    return {
      totalMembers: people.length,
      activeMembers: people.filter((person) => person.active).length,
      newMembers: people.filter((person) => (person.createdAt || "") >= monthStart).length,
      attendanceThisWeek: attendance.filter((record) => record.present && record.date >= weekStart).length,
      attendanceThisMonth: attendance.filter((record) => record.present && record.date >= monthStart).length
    };
  }, [attendance, people]);

  return {
    admins,
    announcements,
    attendance,
    loading,
    people,
    qrCodes,
    refresh,
    shakhas,
    summary,
    upsertAdmin: async (admin: AdminUser) => {
      await saveAdmin(admin);
      setAdmins((items) => [admin, ...items.filter((item) => item.id !== admin.id)]);
    },
    addAnnouncement: async (announcement: Omit<Announcement, "id">) => {
      const saved = await saveAnnouncement(announcement);
      setAnnouncements((items) => [saved, ...items]);
    },
    recordAttendance: async (record: AttendanceRecord) => {
      await saveAttendance(record);
      setAttendance((items) => [record, ...items.filter((item) => item.id !== record.id)]);
    },
    upsertPerson: async (person: Person) => {
      await savePerson(person);
      setPeople((items) => [person, ...items.filter((item) => item.id !== person.id)]);
    },
    saveQr: async (qr: QrCodeRecord) => {
      await saveQrCode(qr);
      setQrCodes((items) => [qr, ...items.filter((item) => item.id !== qr.id)]);
    },
    upsertShakha: async (shakha: Shakha) => {
      await saveShakha(shakha);
      setShakhas((items) => [shakha, ...items.filter((item) => item.id !== shakha.id)]);
    }
  };
}
