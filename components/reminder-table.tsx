"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import {
  formatDate,
  formatTime,
  getStatusClass,
  getStatusDot,
  type Reminder,
  type ReminderStatus,
} from "@/lib/reminders";

export function ReminderTable({
  reminders,
  onStatusChange,
  onDelete,
}: {
  reminders: Reminder[];
  onStatusChange: (id: string, status: ReminderStatus) => void;
  onDelete: (id: string) => void;
}) {
  if (reminders.length === 0) {
    return (
      <div className="table-wrap">
        <div className="empty-state">No reminders match the current view.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Project</th>
            <th>Status</th>
            <th>Reminder Date</th>
            <th>Reminder Time</th>
            <th>Notes</th>
            <th>Done</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {reminders.map((reminder) => (
            <tr key={reminder.id}>
              <td>
                <div className="client-cell">
                  <span className="avatar">{initials(reminder.clientName)}</span>
                  {reminder.clientName}
                </div>
              </td>
              <td>{reminder.projectName}</td>
              <td>
                <span className={`badge ${getStatusClass(reminder.status)}`}>
                  {getStatusDot(reminder.status)} {reminder.status}
                </span>
              </td>
              <td>{formatDate(reminder.reminderDate)}</td>
              <td>{formatTime(reminder.reminderTime)}</td>
              <td>{reminder.notes}</td>
              <td>
                <button
                  aria-label={`Mark ${reminder.clientName} as completed`}
                  className="icon-button"
                  onClick={() => onStatusChange(reminder.id, "Completed")}
                  title="Mark complete"
                  type="button"
                >
                  <Check size={16} aria-hidden />
                </button>
              </td>
              <td>
                <button
                  aria-label={`Edit ${reminder.clientName}`}
                  className="icon-button"
                  title="Edit"
                  type="button"
                >
                  <Pencil size={16} aria-hidden />
                </button>
                <button
                  aria-label={`Delete ${reminder.clientName}`}
                  className="icon-button"
                  onClick={() => onDelete(reminder.id)}
                  title="Delete"
                  type="button"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
