import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function randomAlnum(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    slots: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const quickId = randomAlnum(8);
    const modKey = randomAlnum(16);
    await ctx.db.insert("events", { ...args, quickId, modKey });
    return { quickId, modKey };
  },
});

export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByQuickId = query({
  args: { quickId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_quickId", (q) => q.eq("quickId", args.quickId))
      .unique();
  },
});
