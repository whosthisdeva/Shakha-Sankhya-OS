import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSankhya,
  listAdmins,
  listSankhya,
  listShakhas,
  saveAdmin,
  saveSankhya,
  saveShakha
} from "../lib/db";
import { daysAgoISO } from "../lib/dates";
import {
  emptyCounts,
  sankhyaTotal,
  type AdminUser,
  type SankhyaCounts,
  type SankhyaEntry,
  type Shakha
} from "../types";

export function useAppData(enabled: boolean) {
  const [shakhas, setShakhas] = useState<Shakha[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [sankhya, setSankhya] = useState<SankhyaEntry[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [nextShakhas, nextAdmins, nextSankhya] = await Promise.all([
        listShakhas(),
        listAdmins(),
        listSankhya()
      ]);
      setShakhas(nextShakhas);
      setAdmins(nextAdmins);
      setSankhya(nextSankhya);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    const weekStart = daysAgoISO(7);
    const monthStart = daysAgoISO(30);
    const weekEntries = sankhya.filter((entry) => entry.date >= weekStart);
    const monthEntries = sankhya.filter((entry) => entry.date >= monthStart);
    return {
      shakhaCount: shakhas.length,
      entriesThisWeek: weekEntries.length,
      entriesThisMonth: monthEntries.length,
      totalThisWeek: weekEntries.reduce((sum, entry) => sum + sankhyaTotal(entry.counts), 0),
      totalThisMonth: monthEntries.reduce((sum, entry) => sum + sankhyaTotal(entry.counts), 0)
    };
  }, [sankhya, shakhas.length]);

  return {
    admins,
    error,
    loading,
    refresh,
    sankhya,
    shakhas,
    summary,
    loadSankhyaFor: async (shakhaId: string, date: string) => getSankhya(shakhaId, date),
    upsertAdmin: async (admin: AdminUser) => {
      const saved = await saveAdmin(admin);
      setAdmins((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
      return saved;
    },
    upsertShakha: async (shakha: Shakha) => {
      const saved = await saveShakha(shakha);
      setShakhas((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
      return saved;
    },
    recordSankhya: async (input: {
      shakhaId: string;
      shakhaName: string;
      date: string;
      counts: SankhyaCounts;
      notes: string;
      recordedBy: string;
    }) => {
      const saved = await saveSankhya(input);
      setSankhya((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
      return saved;
    },
    emptyCounts
  };
}
