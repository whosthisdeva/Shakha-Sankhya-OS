import {
  BarChart3,
  Check,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  ClipboardList
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "./lib/firebase";
import { useAppData } from "./hooks/useAppData";
import { useAuth } from "./hooks/useAuthValue";
import {
  NOTES_MAX,
  SANKHYA_FIELDS,
  emptyCounts,
  sankhyaTotal,
  type AdminUser,
  type Role,
  type SankhyaCounts,
  type SankhyaEntry,
  type Shakha
} from "./types";
import { adminRequiresShakha, validateAdminForm } from "./lib/adminAccess";

const roles: Role[] = ["nationalAdmin", "vibhagAdmin", "shakhaAdmin", "teacher", "volunteer"];

function idFrom(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || crypto.randomUUID();
}

function roleLabel(role: Role) {
  return role.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const { user, admin, isAdmin, loading: authLoading, authError, adminCheckError, signIn, logout } = useAuth();
  const canLoad = Boolean(isFirebaseConfigured && user && isAdmin);
  const data = useAppData(canLoad);
  const [tab, setTab] = useState("sankhya");
  const [selectedShakhaId, setSelectedShakhaId] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const selectedShakha = useMemo(() => {
    if (!data.shakhas.length) return undefined;
    return data.shakhas.find((shakha) => shakha.id === selectedShakhaId) ?? data.shakhas[0];
  }, [data.shakhas, selectedShakhaId]);

  useEffect(() => {
    if (admin?.assignedShakhaId && !selectedShakhaId) {
      setSelectedShakhaId(admin.assignedShakhaId);
    } else if (data.shakhas[0] && !selectedShakhaId) {
      setSelectedShakhaId(data.shakhas[0].id);
    }
  }, [admin?.assignedShakhaId, data.shakhas, selectedShakhaId]);

  const nav = [
    { id: "sankhya", label: "Sankhya", icon: ClipboardList },
    { id: "shakhas", label: "Shakhas", icon: ShieldCheck },
    { id: "admins", label: "Admins", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart3 }
  ];

  if (!isFirebaseConfigured) return <SetupNeeded />;

  if (authLoading) {
    return <div className="gate-screen">Checking sign-in…</div>;
  }

  if (!user) {
    return (
      <div className="gate-screen">
        <div className="gate-card">
          <div className="brand-mark">
            <img alt="HSS logo" src="/hss-logo.png" />
          </div>
          <h1>Shakha Mechanics</h1>
          <p>Sign in with Google to record weekly sankhya.</p>
          <button
            className="primary"
            disabled={signingIn}
            onClick={async () => {
              setSigningIn(true);
              try {
                await signIn();
              } catch {
                // authError is set in AuthProvider
              } finally {
                setSigningIn(false);
              }
            }}
            type="button"
          >
            <LogIn size={18} />
            {signingIn ? "Signing in…" : "Sign in with Google"}
          </button>
          {authError ? <p className="form-error">{authError}</p> : null}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="gate-screen">
        <div className="gate-card">
          <h1>Access restricted</h1>
          <p>
            Signed in as <strong>{user.email}</strong>, but there is no active admin profile for this
            account.
          </p>
          {adminCheckError ? <p className="form-error">{adminCheckError}</p> : null}
          <p>
            Expected Firestore doc: <code>admins/{user.email?.toLowerCase()}</code> with{" "}
            <code>active: true</code>.
          </p>
          <button className="text-button" onClick={logout} type="button">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <img alt="HSS logo" src="/hss-logo.png" />
          </div>
          <div>
            <strong>Shakha Mechanics</strong>
            <span>Sankhya for Sampark</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button className={tab === item.id ? "active" : ""} key={item.id} onClick={() => setTab(item.id)} type="button">
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h1>{nav.find((item) => item.id === tab)?.label}</h1>
            <p>
              {roleLabel(admin!.role)} · Firebase connected
            </p>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={data.refresh} title="Refresh data" type="button">
              <RefreshCw size={18} />
            </button>
            <button className="text-button" onClick={logout} type="button">
              <LogOut size={18} />
              {user.displayName || user.email}
            </button>
          </div>
        </header>

        {(tab === "sankhya" || tab === "reports") && (
          <div className="selector-row">
            <label>
              Shakha
              <select value={selectedShakha?.id || ""} onChange={(event) => setSelectedShakhaId(event.target.value)}>
                {data.shakhas.map((shakha) => (
                  <option key={shakha.id} value={shakha.id}>
                    {shakha.name} - {shakha.location}
                  </option>
                ))}
              </select>
            </label>
            {selectedShakha && (
              <span className="status-pill">
                {selectedShakha.vibhag} / {selectedShakha.sambhag} / {selectedShakha.meetingTime}
              </span>
            )}
          </div>
        )}

        {data.error ? <div className="error-banner">{data.error}</div> : null}
        {data.loading ? <div className="empty-state">Loading Shakha Mechanics data…</div> : null}

        {!data.loading && tab === "sankhya" && selectedShakha && (
          <SankhyaScreen
            loadEntry={data.loadSankhyaFor}
            onSave={data.recordSankhya}
            recordedBy={user.uid || user.email || "unknown"}
            selectedShakha={selectedShakha}
          />
        )}
        {!data.loading && tab === "sankhya" && !selectedShakha && (
          <div className="empty-state">Add a shakha first (Shakhas tab), then enter sankhya here.</div>
        )}
        {!data.loading && tab === "shakhas" && <ShakhaScreen onSave={data.upsertShakha} shakhas={data.shakhas} />}
        {!data.loading && tab === "admins" && (
          <AdminScreen
            admins={data.admins}
            currentEmail={user?.email || ""}
            onSave={data.upsertAdmin}
            onRemove={data.removeAdmin}
            shakhas={data.shakhas}
          />
        )}
        {!data.loading && tab === "reports" && (
          <ReportsScreen sankhya={data.sankhya} selectedShakhaId={selectedShakha?.id} shakhas={data.shakhas} summary={data.summary} />
        )}
      </section>
    </main>
  );
}

function SetupNeeded() {
  return (
    <div className="gate-screen">
      <div className="gate-card">
        <h1>Firebase setup needed</h1>
        <p>Copy <code>.env.example</code> to <code>.env.local</code> and fill in your Firebase web app config, then restart the dev server.</p>
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="counter-card">
      <span className="counter-label">{label}</span>
      <div className="counter-controls">
        <button
          aria-label={`Decrease ${label}`}
          className="counter-btn"
          onClick={() => onChange(Math.max(0, value - 1))}
          type="button"
        >
          −
        </button>
        <input
          className="counter-input"
          min={0}
          onChange={(event) => onChange(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
          type="number"
          value={value}
        />
        <button aria-label={`Increase ${label}`} className="counter-btn" onClick={() => onChange(value + 1)} type="button">
          +
        </button>
      </div>
    </div>
  );
}

function SankhyaScreen({
  loadEntry,
  onSave,
  recordedBy,
  selectedShakha
}: {
  loadEntry: (shakhaId: string, date: string) => Promise<SankhyaEntry | null>;
  onSave: (input: {
    shakhaId: string;
    shakhaName: string;
    date: string;
    counts: SankhyaCounts;
    notes: string;
    recordedBy: string;
  }) => Promise<SankhyaEntry>;
  recordedBy: string;
  selectedShakha: Shakha;
}) {
  const [date, setDate] = useState(todayISO());
  const [counts, setCounts] = useState<SankhyaCounts>(emptyCounts());
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(true);

  const load = useCallback(async () => {
    setLoadingEntry(true);
    setError(null);
    try {
      const existing = await loadEntry(selectedShakha.id, date);
      if (existing) {
        setCounts(existing.counts);
        setNotes(existing.notes);
      } else {
        setCounts(emptyCounts());
        setNotes("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sankhya");
      setCounts(emptyCounts());
      setNotes("");
    } finally {
      setLoadingEntry(false);
    }
  }, [date, loadEntry, selectedShakha.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = (key: keyof SankhyaCounts, value: number) => {
    setCounts((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaveState("saving");
    setError(null);
    try {
      await onSave({
        shakhaId: selectedShakha.id,
        shakhaName: selectedShakha.name,
        date,
        counts,
        notes,
        recordedBy
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setSaveState("idle");
    }
  };

  const total = sankhyaTotal(counts);

  return (
    <section className="sankhya-screen">
      <div className="panel wide">
        <div className="panel-header">
          <div>
            <h2>{selectedShakha.name}</h2>
            <p>Enter category counts for the day. One record per shakha per date.</p>
          </div>
          <label>
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>

        {loadingEntry ? (
          <div className="empty-state">Loading entry…</div>
        ) : (
          <>
            <div className="counter-grid">
              {SANKHYA_FIELDS.map((field) => (
                <Counter key={field.key} label={field.label} onChange={(value) => setField(field.key, value)} value={counts[field.key]} />
              ))}
            </div>

            <div className="total-bar">
              <span>Total</span>
              <strong>{total}</strong>
            </div>

            <label className="notes-field">
              Notes
              <textarea
                maxLength={NOTES_MAX}
                onChange={(event) => setNotes(event.target.value.slice(0, NOTES_MAX))}
                placeholder="Optional notes (max 500 characters)"
                rows={3}
                value={notes}
              />
              <small>
                {notes.length}/{NOTES_MAX}
              </small>
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="save-row">
              <button className="primary" disabled={saveState === "saving"} onClick={save} type="button">
                <Check size={18} />
                {saveState === "saving" ? "Saving…" : "Save sankhya"}
              </button>
              {saveState === "saved" ? <span className="saved-hint">Saved</span> : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ShakhaScreen({ onSave, shakhas }: { onSave: (shakha: Shakha) => Promise<unknown>; shakhas: Shakha[] }) {
  const [form, setForm] = useState<Shakha>({
    id: "",
    name: "",
    vibhag: "",
    sambhag: "",
    location: "",
    meetingTime: "",
    type: "",
    karyawah: "",
    mukhyaShikshak: ""
  });
  return (
    <section className="screen-grid">
      <EditorPanel title="Add Shakha" onSubmit={() => onSave({ ...form, id: form.id || idFrom(form.name) })}>
        <TextInput label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <TextInput label="Vibhag" value={form.vibhag} onChange={(vibhag) => setForm({ ...form, vibhag })} />
        <TextInput label="Sambhag" value={form.sambhag} onChange={(sambhag) => setForm({ ...form, sambhag })} />
        <TextInput label="Location" value={form.location} onChange={(location) => setForm({ ...form, location })} />
        <TextInput label="Meeting Time" value={form.meetingTime} onChange={(meetingTime) => setForm({ ...form, meetingTime })} />
        <TextInput label="Type" value={form.type} onChange={(type) => setForm({ ...form, type })} />
        <TextInput label="Karyawah" value={form.karyawah} onChange={(karyawah) => setForm({ ...form, karyawah })} />
        <TextInput label="Mukhya Shikshak" value={form.mukhyaShikshak} onChange={(mukhyaShikshak) => setForm({ ...form, mukhyaShikshak })} />
      </EditorPanel>
      <ListPanel title="Shakhas" items={shakhas.map((item) => `${item.name} / ${item.vibhag} / ${item.location}`)} />
    </section>
  );
}

function AdminScreen({
  admins,
  currentEmail,
  onSave,
  onRemove,
  shakhas
}: {
  admins: AdminUser[];
  currentEmail: string;
  onSave: (admin: AdminUser) => Promise<unknown>;
  onRemove: (email: string) => Promise<unknown>;
  shakhas: Shakha[];
}) {
  const [form, setForm] = useState<AdminUser>({
    id: "",
    email: "",
    role: "nationalAdmin",
    assignedShakhaId: undefined,
    active: true
  });
  const [error, setError] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  const needsShakha = adminRequiresShakha(form.role);
  const selfEmail = currentEmail.trim().toLowerCase();

  return (
    <section className="screen-grid">
      <EditorPanel
        title="Add Administrator"
        onSubmit={async () => {
          setError(null);
          const validationError = validateAdminForm(form);
          if (validationError) {
            setError(validationError);
            throw new Error(validationError);
          }
          const email = form.email.trim().toLowerCase();
          try {
            await onSave({
              ...form,
              id: email,
              email,
              assignedShakhaId: form.role === "nationalAdmin" ? undefined : form.assignedShakhaId || undefined,
              active: true
            });
            setForm({
              id: "",
              email: "",
              role: "nationalAdmin",
              assignedShakhaId: undefined,
              active: true
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save admin");
            throw e;
          }
        }}
      >
        <TextInput label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <SelectInput
          label="Access Level"
          value={form.role}
          options={roles.map((item) => [item, roleLabel(item)])}
          onChange={(role) => {
            const next = role as Role;
            setForm({
              ...form,
              role: next,
              assignedShakhaId: next === "nationalAdmin" ? undefined : form.assignedShakhaId || shakhas[0]?.id
            });
          }}
        />
        <SelectInput
          label="Assigned Shakha"
          value={form.assignedShakhaId || ""}
          options={[
            ["", form.role === "nationalAdmin" ? "Optional / National" : "Select a shakha"],
            ...shakhas.map((item) => [item.id, item.name] as [string, string])
          ]}
          onChange={(assignedShakhaId) => setForm({ ...form, assignedShakhaId: assignedShakhaId || undefined })}
        />
        {needsShakha ? <p className="field-hint">Shakha assignment is required for this role.</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </EditorPanel>

      <div className="panel">
        <h2>Administrators</h2>
        <div className="stack-list">
          {admins.length === 0 ? <div className="empty-state">None yet.</div> : null}
          {admins.map((item) => {
            const isSelf = item.email === selfEmail || item.id === selfEmail;
            const busy = busyEmail === item.email;
            return (
              <div className="admin-row" key={item.id || item.email}>
                <div>
                  <strong>{item.email}</strong>
                  <small>
                    {roleLabel(item.role)} / {item.assignedShakhaId || "All"} /{" "}
                    {item.active ? "Active" : "Blocked"}
                  </small>
                </div>
                <div className="admin-actions">
                  {item.active ? (
                    <button
                      className="text-button"
                      disabled={busy || isSelf}
                      onClick={async () => {
                        setBusyEmail(item.email);
                        try {
                          await onSave({ ...item, active: false });
                        } finally {
                          setBusyEmail(null);
                        }
                      }}
                      title={isSelf ? "You cannot block yourself" : "Block login"}
                      type="button"
                    >
                      Block
                    </button>
                  ) : (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={async () => {
                        setBusyEmail(item.email);
                        try {
                          await onSave({ ...item, active: true });
                        } finally {
                          setBusyEmail(null);
                        }
                      }}
                      type="button"
                    >
                      Restore
                    </button>
                  )}
                  <button
                    className="text-button danger"
                    disabled={busy || isSelf}
                    onClick={async () => {
                      if (!window.confirm(`Remove admin access for ${item.email}?`)) return;
                      setBusyEmail(item.email);
                      try {
                        await onRemove(item.email);
                      } finally {
                        setBusyEmail(null);
                      }
                    }}
                    title={isSelf ? "You cannot delete yourself" : "Delete admin record"}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ReportsScreen({
  sankhya,
  selectedShakhaId,
  shakhas,
  summary
}: {
  sankhya: SankhyaEntry[];
  selectedShakhaId?: string;
  shakhas: Shakha[];
  summary: {
    shakhaCount: number;
    entriesThisWeek: number;
    entriesThisMonth: number;
    totalThisWeek: number;
    totalThisMonth: number;
  };
}) {
  const byShakha = shakhas.map((shakha) => {
    const entries = sankhya.filter((entry) => entry.shakhaId === shakha.id);
    const total = entries.reduce((sum, entry) => sum + sankhyaTotal(entry.counts), 0);
    return { shakha, entries: entries.length, total };
  });
  const recent = sankhya
    .filter((entry) => !selectedShakhaId || entry.shakhaId === selectedShakhaId)
    .slice(0, 12);

  return (
    <section className="reports">
      <div className="metric">
        <span>Shakhas</span>
        <strong>{summary.shakhaCount}</strong>
      </div>
      <div className="metric">
        <span>Entries this week</span>
        <strong>{summary.entriesThisWeek}</strong>
      </div>
      <div className="metric">
        <span>Total this week</span>
        <strong>{summary.totalThisWeek}</strong>
      </div>
      <div className="metric">
        <span>Total this month</span>
        <strong>{summary.totalThisMonth}</strong>
      </div>
      <div className="panel wide">
        <h2>By Shakha</h2>
        <div className="table">
          {byShakha.map((row) => (
            <div className="table-row" key={row.shakha.id}>
              <span>{row.shakha.name}</span>
              <span>{row.entries} days</span>
              <strong>{row.total} total</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="panel wide">
        <h2>Recent entries</h2>
        <div className="table">
          {recent.length === 0 ? <div className="empty-state">No sankhya saved yet.</div> : null}
          {recent.map((entry) => (
            <div className="table-row" key={entry.id}>
              <span>
                {entry.date} · {entry.shakhaName}
              </span>
              <span>
                Sevika {entry.counts.sevika} / SS {entry.counts.swayamSewak} / Kishore {entry.counts.kishores}
              </span>
              <strong>{sankhyaTotal(entry.counts)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorPanel({ children, onSubmit, title }: { children: React.ReactNode; onSubmit: () => Promise<unknown>; title: string }) {
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="panel form-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
          await onSubmit();
        } finally {
          setSaving(false);
        }
      }}
    >
      <h2>{title}</h2>
      {children}
      <button className="primary" disabled={saving} type="submit">
        <Check size={18} />
        Save
      </button>
    </form>
  );
}

function TextInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: [string, string][];
  value: string;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || optionLabel} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListPanel({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <div className="stack-list">
        {items.length === 0 ? <div className="empty-state">None yet.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
