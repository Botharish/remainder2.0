export const STATUSES = ["Waiting", "Follow Up", "Overdue", "Completed"] as const;

export type ReminderStatus = (typeof STATUSES)[number];

export type Reminder = {
  id: string;
  clientName: string;
  projectName: string;
  status: ReminderStatus;
  reminderDate: string;
  reminderTime: string;
  notes: string;
  completed: boolean;
};

export type ImportResult = {
  clientsCreated: number;
  projectsCreated: number;
  remindersCreated: number;
  skippedRows: number;
  errors: string[];
};

export const sampleReminders: Reminder[] = [
  {
    id: "sample-1",
    clientName: "ABC Company",
    projectName: "Website",
    status: "Waiting",
    reminderDate: "2026-07-10",
    reminderTime: "10:00",
    notes: "Call Client",
    completed: false,
  },
  {
    id: "sample-2",
    clientName: "XYZ Solutions",
    projectName: "CRM",
    status: "Follow Up",
    reminderDate: "2026-07-12",
    reminderTime: "14:00",
    notes: "Send Invoice",
    completed: false,
  },
];

export function normalizeStatus(value: string): ReminderStatus {
  const normalized = value.trim().toLowerCase().replace(/[_-]/g, " ");

  if (normalized === "follow up" || normalized === "following up") {
    return "Follow Up";
  }

  if (normalized === "overdue") {
    return "Overdue";
  }

  if (normalized === "completed" || normalized === "complete" || normalized === "done") {
    return "Completed";
  }

  return "Waiting";
}

export function getStatusClass(status: ReminderStatus) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

export function getStatusDot(status: ReminderStatus) {
  return {
    Waiting: "●",
    "Follow Up": "●",
    Overdue: "●",
    Completed: "●",
  }[status];
}

export function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return time;
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

export function importRemindersFromCsv(text: string): {
  reminders: Reminder[];
  result: ImportResult;
} {
  const rows = parseCsv(text);
  const [header, ...dataRows] = rows;
  const errors: string[] = [];
  const clients = new Set<string>();
  const projects = new Set<string>();
  const reminders: Reminder[] = [];

  if (!header) {
    return {
      reminders,
      result: {
        clientsCreated: 0,
        projectsCreated: 0,
        remindersCreated: 0,
        skippedRows: 0,
        errors: ["CSV file is empty."],
      },
    };
  }

  const indexes = new Map(header.map((name, index) => [name.toLowerCase(), index]));
  const required = ["client", "project", "status", "date", "time", "notes"];
  const missing = required.filter((field) => !indexes.has(field));

  if (missing.length > 0) {
    return {
      reminders,
      result: {
        clientsCreated: 0,
        projectsCreated: 0,
        remindersCreated: 0,
        skippedRows: dataRows.length,
        errors: [`Missing columns: ${missing.join(", ")}`],
      },
    };
  }

  for (const [index, row] of dataRows.entries()) {
    const clientName = row[indexes.get("client") ?? 0]?.trim();
    const projectName = row[indexes.get("project") ?? 1]?.trim();
    const status = normalizeStatus(row[indexes.get("status") ?? 2] ?? "");
    const reminderDate = row[indexes.get("date") ?? 3]?.trim();
    const reminderTime = row[indexes.get("time") ?? 4]?.trim();
    const notes = row[indexes.get("notes") ?? 5]?.trim() ?? "";

    if (!clientName || !projectName || !reminderDate || !reminderTime) {
      errors.push(`Row ${index + 2}: missing client, project, date, or time.`);
      continue;
    }

    if (Number.isNaN(new Date(`${reminderDate}T${reminderTime}`).getTime())) {
      errors.push(`Row ${index + 2}: invalid date or time.`);
      continue;
    }

    clients.add(clientName);
    projects.add(`${clientName}::${projectName}`);
    reminders.push({
      id: `${clientName}-${projectName}-${reminderDate}-${reminderTime}-${index}`,
      clientName,
      projectName,
      status,
      reminderDate,
      reminderTime,
      notes,
      completed: status === "Completed",
    });
  }

  return {
    reminders,
    result: {
      clientsCreated: clients.size,
      projectsCreated: projects.size,
      remindersCreated: reminders.length,
      skippedRows: dataRows.length - reminders.length,
      errors,
    },
  };
}

export function toCsv(reminders: Reminder[]) {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  };

  const rows = [
    ["client", "project", "status", "date", "time", "notes"],
    ...reminders.map((reminder) => [
      reminder.clientName,
      reminder.projectName,
      reminder.status,
      reminder.reminderDate,
      reminder.reminderTime,
      reminder.notes,
    ]),
  ];

  return rows.map((row) => row.map(escape).join(",")).join("\n");
}
