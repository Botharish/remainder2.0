"use client";

import {
  Bell,
  CalendarDays,
  Download,
  Kanban,
  Plus,
  Search,
  TableProperties,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ImportPanel } from "@/components/import-panel";
import { ReminderTable } from "@/components/reminder-table";
import { type AppView, Sidebar } from "@/components/sidebar";
import {
  formatDate,
  formatTime,
  getStatusClass,
  getStatusDot,
  sampleReminders,
  STATUSES,
  toCsv,
  type ImportResult,
  type Reminder,
  type ReminderStatus,
} from "@/lib/reminders";

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | "All">("All");
  const [reminders, setReminders] = useState<Reminder[]>(sampleReminders);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("crm-reminders");
    if (!saved) {
      return;
    }

    try {
      setReminders(JSON.parse(saved) as Reminder[]);
    } catch {
      window.localStorage.removeItem("crm-reminders");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("crm-reminders", JSON.stringify(reminders));
  }, [reminders]);

  const filtered = useMemo(() => {
    return reminders.filter((reminder) => {
      const haystack = [
        reminder.clientName,
        reminder.projectName,
        reminder.status,
        reminder.reminderDate,
        reminder.reminderTime,
        reminder.notes,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus = statusFilter === "All" || reminder.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, reminders, statusFilter]);

  const stats = useMemo(
    () => ({
      clients: new Set(reminders.map((reminder) => reminder.clientName)).size,
      projects: new Set(reminders.map((reminder) => `${reminder.clientName}:${reminder.projectName}`)).size,
      reminders: reminders.length,
      overdue: reminders.filter((reminder) => reminder.status === "Overdue").length,
    }),
    [reminders],
  );

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "default") {
      return;
    }

    void Notification.requestPermission();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      const currentDate = now.toISOString().slice(0, 10);
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const due = reminders.find(
        (reminder) =>
          !reminder.completed &&
          reminder.reminderDate === currentDate &&
          reminder.reminderTime === currentTime,
      );

      if (!due) {
        return;
      }

      setToast(`${due.clientName} - ${due.projectName}: ${due.notes}`);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Reminder due", {
          body: `${due.clientName} - ${due.projectName}: ${due.notes}`,
        });
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [reminders]);

  function handleImport(imported: Reminder[], result: ImportResult) {
    if (imported.length > 0) {
      setReminders(imported);
      setActiveView("dashboard");
    }

    setToast(
      `Imported ${result.remindersCreated} reminders. Skipped ${result.skippedRows} rows.`,
    );
  }

  function handleExport() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reminders-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleStatusChange(id: string, status: ReminderStatus) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id
          ? { ...reminder, status, completed: status === "Completed" }
          : reminder,
      ),
    );
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="main">
        {activeView === "import" ? (
          <ImportPanel onImport={handleImport} />
        ) : (
          <>
            <Header activeView={activeView} />

            <section className="stats" aria-label="Reminder summary">
              <Stat label="Clients" value={stats.clients} />
              <Stat label="Projects" value={stats.projects} />
              <Stat label="Reminders" value={stats.reminders} />
              <Stat label="Overdue" value={stats.overdue} />
            </section>

            <div className="toolbar">
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{ left: 10, position: "absolute", top: 11 }}
                  aria-hidden
                />
                <input
                  className="input"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search clients, projects, notes"
                  style={{ paddingLeft: 34 }}
                  value={query}
                />
              </div>

              <select
                className="select"
                onChange={(event) => setStatusFilter(event.target.value as ReminderStatus | "All")}
                value={statusFilter}
              >
                <option>All</option>
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>

              <button className="button" onClick={() => setActiveView("calendar")} type="button">
                <CalendarDays size={16} aria-hidden />
                Calendar
              </button>
              <button className="button" onClick={() => setActiveView("kanban")} type="button">
                <Kanban size={16} aria-hidden />
                Kanban
              </button>
              <button className="button" onClick={handleExport} type="button">
                <Download size={16} aria-hidden />
                Export
              </button>
              <button className="button primary" onClick={() => setActiveView("import")} type="button">
                <Plus size={16} aria-hidden />
                Import
              </button>
            </div>

            {activeView === "calendar" ? (
              <CalendarView reminders={filtered} />
            ) : activeView === "kanban" ? (
              <KanbanView reminders={filtered} onStatusChange={handleStatusChange} />
            ) : (
              <ReminderTable
                reminders={filtered}
                onDelete={(id) => setReminders((current) => current.filter((item) => item.id !== id))}
                onStatusChange={handleStatusChange}
              />
            )}
          </>
        )}
      </main>

      {toast ? (
        <div className="toast" role="status">
          <Bell size={18} aria-hidden />
          {toast}
          <button className="button ghost" onClick={() => setToast(null)} type="button">
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Header({ activeView }: { activeView: AppView }) {
  const title =
    activeView === "calendar"
      ? "Calendar"
      : activeView === "kanban"
        ? "Kanban"
        : activeView.charAt(0).toUpperCase() + activeView.slice(1);

  return (
    <div className="topbar">
      <div>
        <p className="eyebrow">Notion-style CRM Reminder System</p>
        <h1>{title}</h1>
        <p className="page-copy">
          Import CSV data, manage client follow-ups, and keep reminders visible in one clean table.
        </p>
      </div>
      <button className="button" type="button">
        <TableProperties size={16} aria-hidden />
        Database view
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

function CalendarView({ reminders }: { reminders: Reminder[] }) {
  const grouped = Object.entries(
    reminders.reduce<Record<string, Reminder[]>>((days, reminder) => {
      days[reminder.reminderDate] = [...(days[reminder.reminderDate] ?? []), reminder];
      return days;
    }, {}),
  );

  return (
    <div className="calendar-grid">
      {grouped.map(([date, items]) => (
        <section className="mini-card" key={date}>
          <h3>{formatDate(date)}</h3>
          {items.map((item) => (
            <p key={item.id}>
              {formatTime(item.reminderTime)} · {item.clientName} · {item.projectName}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

function KanbanView({
  reminders,
  onStatusChange,
}: {
  reminders: Reminder[];
  onStatusChange: (id: string, status: ReminderStatus) => void;
}) {
  return (
    <div className="kanban-grid">
      {STATUSES.map((status) => (
        <section className="mini-card" key={status}>
          <h3>
            <span className={`badge ${getStatusClass(status)}`}>
              {getStatusDot(status)} {status}
            </span>
          </h3>
          {reminders
            .filter((reminder) => reminder.status === status)
            .map((reminder) => (
              <article className="mini-card" key={reminder.id}>
                <h3>{reminder.clientName}</h3>
                <p>{reminder.projectName}</p>
                <p>
                  {formatDate(reminder.reminderDate)} · {formatTime(reminder.reminderTime)}
                </p>
                <button
                  className="button"
                  onClick={() => onStatusChange(reminder.id, "Completed")}
                  type="button"
                >
                  Complete
                </button>
              </article>
            ))}
        </section>
      ))}
    </div>
  );
}
