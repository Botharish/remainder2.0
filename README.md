# CRM Reminder System

A CSV-first, Notion-style CRM reminder dashboard built with Next.js and Convex.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## CSV format

```csv
client,project,status,date,time,notes
ABC Company,Website,Waiting,2026-07-10,10:00,Call Client
XYZ Solutions,CRM,Follow Up,2026-07-12,14:00,Send Invoice
```

## Convex

The backend schema and functions live in `convex/`.

Configure Convex first:

```bash
npx convex dev
```

Then Convex will create `convex/_generated` for API types and wire the cron:

```ts
cronJobs.interval(
  "check reminders",
  { minutes: 1 },
  internal.reminders.sendNotifications,
);
```
