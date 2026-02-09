import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import TimeGrid, { HOURS, slotKey } from "./TimeGrid.tsx";

type Rating = "great" | "good" | "fine";
type Brush = Rating | "none";

const RATING_COLORS: Record<Rating, string> = {
  great: "#22c55e",
  good: "#65a30d",
  fine: "#8B8B3B",
};

export default function Vote({ eventId }: { eventId: string }) {
  const event = useQuery(api.events.get, {
    id: eventId as Id<"events">,
  });
  const submitVote = useMutation(api.votes.submit);

  const [voterName, setVoterName] = useState("");
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map());
  const [brush, setBrush] = useState<Brush>("great");
  const [submitted, setSubmitted] = useState(false);
  const effectiveBrush = useRef<Brush>(brush);

  const applyEffectiveBrush = useCallback(
    (slot: string) => {
      setRatings((prev) => {
        const next = new Map(prev);
        if (effectiveBrush.current === "none") {
          next.delete(slot);
        } else {
          next.set(slot, effectiveBrush.current);
        }
        return next;
      });
    },
    []
  );

  const handleDragStart = useCallback(
    (slot: string) => {
      // If the cell already matches the selected brush, erase instead
      const currentRating = ratings.get(slot);
      if (
        brush !== "none" &&
        currentRating === brush
      ) {
        effectiveBrush.current = "none";
      } else {
        effectiveBrush.current = brush;
      }
      applyEffectiveBrush(slot);
    },
    [brush, ratings, applyEffectiveBrush]
  );

  const handleSubmit = async () => {
    if (!voterName.trim() || !event) return;
    await submitVote({
      eventId: eventId as Id<"events">,
      voterName: voterName.trim(),
      ratings: Array.from(ratings.entries()).map(([slot, rating]) => ({
        slot,
        rating,
      })),
    });
    setSubmitted(true);
  };

  if (event === undefined) return <div className="app">Loading...</div>;
  if (event === null) return <div className="app">Event not found.</div>;

  const slots = new Set(event.slots);
  const dates = [...new Set(event.slots.map((s) => s.split(":")[0]))].sort();

  if (submitted) {
    const base = window.location.href.split("#")[0];
    const viewUrl = `${base}#/view/${eventId}`;
    return (
      <div className="app">
        <div className="created-result">
          <h2>Vote Submitted!</h2>
          <p>
            View results: <a href={viewUrl}>{viewUrl}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>{event.name}</h1>
      {event.description && (
        <p style={{ marginBottom: 16, color: "#555" }}>{event.description}</p>
      )}
      <p style={{ color: "#666", marginBottom: 8 }}>
        Click or click+drag to paint over all the times that work for you.
      </p>

      <div className="brush-selector">
        <span>Brush:</span>
        {(["great", "good", "fine", "none"] as const).map((b) => (
          <button
            key={b}
            className={`brush-btn brush-${b} ${brush === b ? "active" : ""}`}
            onClick={() => setBrush(b)}
          >
            {b === "none"
              ? "Can't"
              : b.charAt(0).toUpperCase() + b.slice(1)}
          </button>
        ))}
      </div>

      <TimeGrid
        dates={dates}
        activeSlots={slots}
        getCellStyle={(slot) => ({
          backgroundColor: ratings.has(slot)
            ? RATING_COLORS[ratings.get(slot)!]
            : "#d1d5db",
        })}
        onDragStart={handleDragStart}
        onDragEnter={applyEffectiveBrush}
        onColumnHeaderClick={(date) => {
          const colSlots = HOURS.map((h) => slotKey(date, h)).filter((s) =>
            slots.has(s)
          );
          setRatings((prev) => {
            const allMatch =
              brush === "none"
                ? colSlots.every((s) => !prev.has(s))
                : colSlots.every((s) => prev.get(s) === brush);
            const next = new Map(prev);
            for (const s of colSlots) {
              if (allMatch) {
                next.delete(s);
              } else if (brush !== "none") {
                next.set(s, brush);
              } else {
                next.delete(s);
              }
            }
            return next;
          });
        }}
      />

      <div className="form-group" style={{ marginTop: 16 }}>
        <label>Your Name</label>
        <input
          value={voterName}
          onChange={(e) => setVoterName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!voterName.trim()}
        style={{ marginTop: 8 }}
      >
        Submit Vote
      </button>
    </div>
  );
}
