"use client";

import {
  Bell,
  FolderKanban,
  Gauge,
  Import,
  ListChecks,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

const items = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "clients", label: "Clients", icon: Users },
  { id: "import", label: "Import CSV", icon: Import },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
];

export type AppView = (typeof items)[number]["id"] | "calendar" | "kanban";

export function Sidebar({
  activeView,
  onViewChange,
}: {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <ListChecks size={18} aria-hidden />
        </span>
        CRM Reminders
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <Icon size={18} aria-hidden />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
