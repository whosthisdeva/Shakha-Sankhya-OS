import QRCode from "qrcode";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  Clock,
  ClipboardList,
  Download,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  UserPlus
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "./lib/firebase";
import { nowISO, nowTime, todayISO } from "./lib/dates";
import { useAppData } from "./hooks/useAppData";
import { useAuth } from "./hooks/useAuthValue";
import type { AdminUser, AttendanceRecord, Gender, Person, QrCodeRecord, Role, Shakha } from "./types";

const roles: Role[] = ["nationalAdmin", "vibhagAdmin", "shakhaAdmin", "teacher", "volunteer"];
const genders: Gender[] = ["Female", "Male", "Other", "Prefer not to say"];

function idFrom(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || crypto.randomUUID();
}

function roleLabel(role: Role) {
  return role.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function App() {
  const { user, loading: authLoading, signIn, logout } = useAuth();
  const data = useAppData();
  const [tab, setTab] = useState("attendance");
  const [selectedShakhaId, setSelectedShakhaId] = useState("aryabhatta");

  const selectedShakha = data.shakhas.find((shakha) => shakha.id === selectedShakhaId) ?? data.shakhas[0];
  const membersForShakha = data.people.filter((person) => person.assignedShakhaId === selectedShakha?.id && person.active);

  useEffect(() => {
    if (!selectedShakhaId && data.shakhas[0]) setSelectedShakhaId(data.shakhas[0].id);
  }, [data.shakhas, selectedShakhaId]);

  const nav = [
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "qr", label: "QR", icon: QrCode },
    { id: "shakhas", label: "Shakhas", icon: ShieldCheck },
    { id: "people", label: "People", icon: UserPlus },
    { id: "admins", label: "Admins", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Bell }
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>ShakhaOS</strong>
            <span>Attendance & Volunteer Assistant</span>
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
            <p>{isFirebaseConfigured ? "Connected to Firebase" : "Demo mode until Firebase environment variables are set"}</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={data.refresh} title="Refresh data" type="button">
              <RefreshCw size={18} />
            </button>
            {user ? (
              <button className="text-button" onClick={logout} type="button">
                <LogOut size={18} />
                {user.displayName || user.email}
              </button>
            ) : (
              <button className="primary" disabled={authLoading || !isFirebaseConfigured} onClick={signIn} type="button">
                <LogIn size={18} />
                Sign in with Google
              </button>
            )}
          </div>
        </header>

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

        {data.loading ? <div className="empty-state">Loading ShakhaOS data...</div> : null}
        {!data.loading && tab === "attendance" && selectedShakha && (
          <AttendanceScreen
            attendance={data.attendance}
            people={membersForShakha}
            selectedShakha={selectedShakha}
            onRecord={(record) => data.recordAttendance(record)}
            recordedBy={user?.uid || "demo"}
          />
        )}
        {!data.loading && tab === "qr" && selectedShakha && (
          <QrScreen generatedBy={user?.uid || "demo"} onSave={data.saveQr} qrCodes={data.qrCodes} selectedShakha={selectedShakha} />
        )}
        {!data.loading && tab === "shakhas" && <ShakhaScreen attendance={data.attendance} onSave={data.upsertShakha} people={data.people} shakhas={data.shakhas} />}
        {!data.loading && tab === "people" && <PeopleScreen onSave={data.upsertPerson} people={data.people} shakhas={data.shakhas} />}
        {!data.loading && tab === "admins" && <AdminScreen admins={data.admins} onSave={data.upsertAdmin} shakhas={data.shakhas} />}
        {!data.loading && tab === "reports" && (
          <ReportsScreen attendance={data.attendance} people={data.people} shakhas={data.shakhas} summary={data.summary} />
        )}
        {!data.loading && tab === "announcements" && (
          <AnnouncementScreen
            announcements={data.announcements}
            createdBy={user?.uid || "demo"}
            onSave={data.addAnnouncement}
            selectedShakha={selectedShakha}
          />
        )}
      </section>
    </main>
  );
}

function AttendanceScreen({
  attendance,
  onRecord,
  people,
  recordedBy,
  selectedShakha
}: {
  attendance: AttendanceRecord[];
  onRecord: (record: AttendanceRecord) => Promise<void>;
  people: Person[];
  recordedBy: string;
  selectedShakha: Shakha;
}) {
  const [date, setDate] = useState(todayISO());
  const [sessionTime, setSessionTime] = useState(nowTime());
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const recordsForDate = attendance.filter((record) => record.shakhaId === selectedShakha.id && record.date === date && record.present);
  const alreadyPresent = new Set(recordsForDate.map((record) => record.memberId));
  const selectedCount = Object.values(marked).filter(Boolean).length;
  const visiblePeople = people.filter((person) => {
    const searchText = `${person.name} ${person.position} ${person.location}`.toLowerCase();
    return searchText.includes(search.trim().toLowerCase());
  });
  const recentSessions = attendance
    .filter((record) => record.shakhaId === selectedShakha.id && record.present)
    .reduce<Record<string, number>>((sessions, record) => {
      sessions[record.date] = (sessions[record.date] || 0) + 1;
      return sessions;
    }, {});
  const recentSessionRows = Object.entries(recentSessions)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 5);

  useEffect(() => {
    setMarked({});
    setSearch("");
  }, [date, selectedShakha.id]);

  const submit = async () => {
    await Promise.all(
      people
        .filter((person) => marked[person.id] && !alreadyPresent.has(person.id))
        .map((person) =>
          onRecord({
            id: `${date}-${selectedShakha.id}-${person.id}`,
            date,
            shakhaId: selectedShakha.id,
            memberId: person.id,
            memberName: person.name,
            present: true,
            timeRecorded: sessionTime,
            recordedBy,
            location: selectedShakha.location
          })
        )
    );
    setMarked({});
  };

  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-header">
          <div>
            <h2>{selectedShakha.name} Attendance</h2>
            <p>{people.length} active members / {recordsForDate.length} already marked today</p>
          </div>
          <div className="toolbar">
            <label>
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Time
              <input value={sessionTime} onChange={(event) => setSessionTime(event.target.value)} />
            </label>
          </div>
        </div>
        <div className="attendance-actions">
          <label className="search-field">
            Search members
            <span>
              <Search size={16} />
              <input placeholder="Name, role, location" value={search} onChange={(event) => setSearch(event.target.value)} />
            </span>
          </label>
          <button className="text-button" onClick={() => setMarked(Object.fromEntries(visiblePeople.filter((person) => !alreadyPresent.has(person.id)).map((person) => [person.id, true])))} type="button">
            <UserCheck size={18} />
            Mark all visible
          </button>
          <button className="text-button" onClick={() => setMarked({})} type="button">
            <RefreshCw size={18} />
            Clear
          </button>
        </div>
        <div className="member-list">
          {visiblePeople.map((person) => {
            const present = alreadyPresent.has(person.id);
            return (
            <button
              className={present || marked[person.id] ? "member-row selected" : "member-row"}
              disabled={present}
              key={person.id}
              onClick={() => setMarked((items) => ({ ...items, [person.id]: !items[person.id] }))}
              type="button"
            >
              <span>
                <strong>{person.name}</strong>
                <small>
                  {person.gender} / {person.location} / {person.position}
                </small>
              </span>
              <span className="row-status">{present ? "Saved" : marked[person.id] ? <Check size={18} /> : "Absent"}</span>
            </button>
            );
          })}
        </div>
        <button className="primary" disabled={!selectedCount} onClick={submit} type="button">
          <CalendarCheck size={18} />
          Save {selectedCount} Attendance
        </button>
        {recentSessionRows.length ? (
          <div className="history-strip">
            {recentSessionRows.map(([sessionDate, count]) => (
              <span key={sessionDate}>
                <ClipboardList size={16} />
                {sessionDate}: {count}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function QrScreen({
  generatedBy,
  onSave,
  qrCodes,
  selectedShakha
}: {
  generatedBy: string;
  onSave: (qr: QrCodeRecord) => Promise<void>;
  qrCodes: QrCodeRecord[];
  selectedShakha: Shakha;
}) {
  const [qrUrl, setQrUrl] = useState("");
  const payload = useMemo(() => JSON.stringify({ type: "shakha-checkin", shakhaId: selectedShakha.id, name: selectedShakha.name }), [selectedShakha]);

  const generate = async () => {
    const url = await QRCode.toDataURL(payload, { width: 360, margin: 2, color: { dark: "#0f3d3a", light: "#ffffff" } });
    setQrUrl(url);
    await onSave({
      id: selectedShakha.id,
      shakhaId: selectedShakha.id,
      shakhaName: selectedShakha.name,
      payload,
      generatedDate: todayISO(),
      generatedBy
    });
  };

  return (
    <section className="screen-grid">
      <div className="panel qr-panel">
        <div className="panel-header">
          <div>
            <h2>{selectedShakha.name} QR Code</h2>
            <p>Generated records: {qrCodes.length}</p>
          </div>
          <button className="primary" onClick={generate} type="button">
            <QrCode size={18} />
            Generate
          </button>
        </div>
        {qrUrl ? <img alt={`${selectedShakha.name} QR code`} className="qr-image" src={qrUrl} /> : <div className="empty-state">Generate a QR code for this shakha.</div>}
        {qrUrl ? (
          <a className="text-button download-link" download={`${selectedShakha.name}-qr.png`} href={qrUrl}>
            <Download size={18} />
            Download PNG
          </a>
        ) : null}
      </div>
    </section>
  );
}

function ShakhaScreen({
  attendance,
  onSave,
  people,
  shakhas
}: {
  attendance: AttendanceRecord[];
  onSave: (shakha: Shakha) => Promise<void>;
  people: Person[];
  shakhas: Shakha[];
}) {
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
  const [editingId, setEditingId] = useState("");
  const activeMembers = people.filter((person) => person.active);
  const selectedMembers = form.id ? people.filter((person) => person.assignedShakhaId === form.id) : [];
  const selectedAttendance = form.id ? attendance.filter((record) => record.shakhaId === form.id && record.present) : [];

  const editShakha = (shakha: Shakha) => {
    setEditingId(shakha.id);
    setForm(shakha);
  };

  const resetForm = () => {
    setEditingId("");
    setForm({
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
  };

  const save = async () => {
    const id = form.id || idFrom(form.name);
    const saved: Shakha = editingId ? { ...form, id, updatedAt: nowISO() } : { ...form, id, createdAt: nowISO() };
    await onSave(saved);
    resetForm();
  };

  return (
    <section className="screen-grid">
      <EditorPanel title={editingId ? "Edit Shakha" : "Add Shakha"} onSubmit={save}>
        <TextInput label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <TextInput label="Vibhag" value={form.vibhag} onChange={(vibhag) => setForm({ ...form, vibhag })} />
        <TextInput label="Sambhag" value={form.sambhag} onChange={(sambhag) => setForm({ ...form, sambhag })} />
        <TextInput label="Location" value={form.location} onChange={(location) => setForm({ ...form, location })} />
        <TextInput label="Meeting Time" value={form.meetingTime} onChange={(meetingTime) => setForm({ ...form, meetingTime })} />
        <TextInput label="Type" value={form.type} onChange={(type) => setForm({ ...form, type })} />
        <TextInput label="Karyawah" value={form.karyawah} onChange={(karyawah) => setForm({ ...form, karyawah })} />
        <TextInput label="Mukhya Shikshak" value={form.mukhyaShikshak} onChange={(mukhyaShikshak) => setForm({ ...form, mukhyaShikshak })} />
        {editingId ? (
          <button className="text-button" onClick={resetForm} type="button">
            Add New Instead
          </button>
        ) : null}
      </EditorPanel>
      <div className="panel shakha-dashboard">
        <h2>Shakha Overview</h2>
        <div className="mini-metrics">
          <div><span>Shakhas</span><strong>{shakhas.length}</strong></div>
          <div><span>Active Members</span><strong>{activeMembers.length}</strong></div>
          <div><span>Selected Members</span><strong>{selectedMembers.length}</strong></div>
          <div><span>Selected Attendance</span><strong>{selectedAttendance.length}</strong></div>
        </div>
        <div className="shakha-list">
          {shakhas.map((item) => {
            const memberCount = people.filter((person) => person.assignedShakhaId === item.id && person.active).length;
            const attendanceCount = attendance.filter((record) => record.shakhaId === item.id && record.present).length;
            return (
              <article className={editingId === item.id ? "shakha-card selected" : "shakha-card"} key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p><MapPin size={15} /> {item.location} / {item.vibhag}</p>
                  <p><Clock size={15} /> {item.meetingTime} / {item.type}</p>
                </div>
                <div className="card-stats">
                  <span>{memberCount} members</span>
                  <span>{attendanceCount} records</span>
                </div>
                <div className="leader-row">
                  <span>Karyawah: {item.karyawah || "Not set"}</span>
                  <span>Mukhya Shikshak: {item.mukhyaShikshak || "Not set"}</span>
                </div>
                <button className="text-button" onClick={() => editShakha(item)} type="button">
                  <Pencil size={16} />
                  Edit
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PeopleScreen({ onSave, people, shakhas }: { onSave: (person: Person) => Promise<void>; people: Person[]; shakhas: Shakha[] }) {
  const [form, setForm] = useState<Person>({
    id: "",
    name: "",
    position: "",
    assignedShakhaId: shakhas[0]?.id || "",
    gender: "Female",
    location: "",
    email: "",
    active: true
  });
  return (
    <section className="screen-grid">
      <EditorPanel title="Add Person" onSubmit={() => onSave({ ...form, id: form.id || idFrom(form.email || form.name), createdAt: nowISO() })}>
        <TextInput label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <TextInput label="Position" value={form.position} onChange={(position) => setForm({ ...form, position })} />
        <SelectInput label="Assigned Shakha" value={form.assignedShakhaId} options={shakhas.map((item) => [item.id, item.name])} onChange={(assignedShakhaId) => setForm({ ...form, assignedShakhaId })} />
        <SelectInput label="Gender" value={form.gender} options={genders.map((item) => [item, item])} onChange={(gender) => setForm({ ...form, gender: gender as Gender })} />
        <TextInput label="Location" value={form.location} onChange={(location) => setForm({ ...form, location })} />
        <TextInput label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      </EditorPanel>
      <ListPanel title="People" items={people.map((item) => `${item.name} / ${item.position} / ${item.email}`)} />
    </section>
  );
}

function AdminScreen({ admins, onSave, shakhas }: { admins: AdminUser[]; onSave: (admin: AdminUser) => Promise<void>; shakhas: Shakha[] }) {
  const [form, setForm] = useState<AdminUser>({ id: "", email: "", role: "teacher", assignedShakhaId: shakhas[0]?.id || "", active: true });
  return (
    <section className="screen-grid">
      <EditorPanel title="Add Administrator" onSubmit={() => onSave({ ...form, id: form.id || form.email.trim().toLowerCase() })}>
        <TextInput label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <SelectInput label="Access Level" value={form.role} options={roles.map((item) => [item, roleLabel(item)])} onChange={(role) => setForm({ ...form, role: role as Role })} />
        <SelectInput label="Assigned Shakha" value={form.assignedShakhaId || ""} options={[["", "Optional"], ...shakhas.map((item) => [item.id, item.name] as [string, string])]} onChange={(assignedShakhaId) => setForm({ ...form, assignedShakhaId })} />
      </EditorPanel>
      <ListPanel title="Administrators" items={admins.map((item) => `${item.email} / ${roleLabel(item.role)} / ${item.assignedShakhaId || "All"}`)} />
    </section>
  );
}

function ReportsScreen({
  attendance,
  people,
  shakhas,
  summary
}: {
  attendance: AttendanceRecord[];
  people: Person[];
  shakhas: Shakha[];
  summary: { totalMembers: number; activeMembers: number; newMembers: number; attendanceThisWeek: number; attendanceThisMonth: number };
}) {
  const byShakha = shakhas.map((shakha) => ({
    shakha,
    members: people.filter((person) => person.assignedShakhaId === shakha.id).length,
    attendance: attendance.filter((record) => record.shakhaId === shakha.id && record.present).length
  }));
  return (
    <section className="reports">
      <div className="metric"><span>Total Members</span><strong>{summary.totalMembers}</strong></div>
      <div className="metric"><span>Active Members</span><strong>{summary.activeMembers}</strong></div>
      <div className="metric"><span>New Members</span><strong>{summary.newMembers}</strong></div>
      <div className="metric"><span>This Week</span><strong>{summary.attendanceThisWeek}</strong></div>
      <div className="metric"><span>This Month</span><strong>{summary.attendanceThisMonth}</strong></div>
      <div className="panel wide">
        <h2>Attendance by Shakha</h2>
        <div className="table">
          {byShakha.map((row) => (
            <div className="table-row" key={row.shakha.id}>
              <span>{row.shakha.name}</span>
              <span>{row.members} members</span>
              <strong>{row.attendance} attendance records</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnnouncementScreen({
  announcements,
  createdBy,
  onSave,
  selectedShakha
}: {
  announcements: { id: string; title: string; body: string; audience: string }[];
  createdBy: string;
  onSave: (announcement: { title: string; body: string; audience: "All" | "National" | "Vibhag" | "Shakha"; shakhaId?: string; createdBy: string; createdAt: string }) => Promise<void>;
  selectedShakha?: Shakha;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <section className="screen-grid">
      <EditorPanel title="Create Announcement" onSubmit={() => onSave({ title, body, audience: "Shakha", shakhaId: selectedShakha?.id, createdBy, createdAt: nowISO() })}>
        <TextInput label="Title" value={title} onChange={setTitle} />
        <label>
          Body
          <textarea value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
      </EditorPanel>
      <div className="panel">
        <h2>Announcements</h2>
        {announcements.map((item) => (
          <article className="announcement" key={item.id}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <small>{item.audience}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function EditorPanel({ children, onSubmit, title }: { children: React.ReactNode; onSubmit: () => Promise<void>; title: string }) {
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="panel form-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        await onSubmit();
        setSaving(false);
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
