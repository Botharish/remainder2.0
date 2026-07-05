import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

const reminderInput = v.object({
  clientName: v.string(),
  projectName: v.string(),
  status: v.string(),
  reminderDate: v.number(),
  reminderTime: v.string(),
  notes: v.string(),
  completed: v.boolean(),
});

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reminders = await ctx.db.query("reminders").order("desc").collect();
    const search = args.search?.trim().toLowerCase();

    return reminders.filter((reminder) => {
      const matchesStatus = !args.status || args.status === "All" || reminder.status === args.status;
      const matchesSearch =
        !search ||
        [
          reminder.clientName,
          reminder.projectName,
          reminder.status,
          reminder.reminderTime,
          reminder.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);

      return matchesStatus && matchesSearch;
    });
  },
});

export const importCsvRows = mutation({
  args: {
    fileName: v.string(),
    rows: v.array(reminderInput),
    skippedRows: v.number(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const clientIds = new Map<string, string>();
    const projectIds = new Map<string, string>();
    let clientsCreated = 0;
    let projectsCreated = 0;

    for (const row of args.rows) {
      let clientId = clientIds.get(row.clientName);

      if (!clientId) {
        const existingClient = await ctx.db
          .query("clients")
          .withIndex("by_name", (q) => q.eq("name", row.clientName))
          .first();

        clientId =
          existingClient?._id ??
          (await ctx.db.insert("clients", {
            name: row.clientName,
            createdBy: args.createdBy,
            createdAt: now,
          }));

        if (!existingClient) {
          clientsCreated += 1;
        }

        clientIds.set(row.clientName, clientId);
      }

      const projectKey = `${clientId}:${row.projectName}`;
      let projectId = projectIds.get(projectKey);

      if (!projectId) {
        const existingProject = await ctx.db
          .query("projects")
          .withIndex("by_client_name", (q) => q.eq("clientId", clientId as any).eq("name", row.projectName))
          .first();

        projectId =
          existingProject?._id ??
          (await ctx.db.insert("projects", {
            clientId: clientId as any,
            name: row.projectName,
            createdBy: args.createdBy,
            createdAt: now,
          }));

        if (!existingProject) {
          projectsCreated += 1;
        }

        projectIds.set(projectKey, projectId);
      }

      await ctx.db.insert("reminders", {
        ...row,
        clientId: clientId as any,
        projectId: projectId as any,
        createdBy: args.createdBy,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("importHistory", {
      fileName: args.fileName,
      clientsCreated,
      projectsCreated,
      remindersCreated: args.rows.length,
      skippedRows: args.skippedRows,
      createdBy: args.createdBy,
      createdAt: now,
    });

    await ctx.db.insert("logs", {
      type: "import",
      message: `Imported ${args.rows.length} reminders from ${args.fileName}.`,
      createdAt: now,
    });

    return {
      clientsCreated,
      projectsCreated,
      remindersCreated: args.rows.length,
      skippedRows: args.skippedRows,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("reminders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      completed: args.status === "Completed",
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("reminders"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const sendNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const dueMinute = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      0,
      0,
    ).getTime();

    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_due", (q) => q.eq("completed", false).eq("reminderDate", dueMinute))
      .collect();

    for (const reminder of reminders) {
      if (reminder.notifiedAt) {
        continue;
      }

      await ctx.db.patch(reminder._id, {
        notifiedAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("logs", {
        type: "notification",
        reminderId: reminder._id,
        message: `Reminder due for ${reminder.clientName} / ${reminder.projectName}: ${reminder.notes}`,
        createdAt: Date.now(),
      });
    }

    return reminders.length;
  },
});
