import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const upsert = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.email) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (existing) {
        return existing._id;
      }
    }

    return await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
