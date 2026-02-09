import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    eventId: v.id("events"),
    voterName: v.string(),
    ratings: v.array(
      v.object({
        slot: v.string(),
        rating: v.union(
          v.literal("great"),
          v.literal("good"),
          v.literal("fine")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("votes", args);
  },
});

export const getByEvent = query({
  args: { eventId: v.id("events"), modKey: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.modKey !== args.modKey) {
      throw new Error("Invalid modKey");
    }
    return await ctx.db
      .query("votes")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});
