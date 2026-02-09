import { useState, useMemo, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import TimeGrid, { slotKey, HOURS } from "./TimeGrid.tsx";

export default function CreateEvent() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 13);
    return d.toISOString().split("T")[0];
  });
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [createdEvent, setCreatedEvent] = useState<{
    quickId: string;
    modKey: string;
  } | null>(null);
  const [dragAction, setDragAction] = useState<"add" | "remove">("add");

  const createEvent = useMutation(api.events.create);

  const dates = useMemo(() => {
    const result: string[] = [];
    const current = new Date(startDate + "T12:00:00");
    const end = new Date(endDate + "T12:00:00");
    while (current <= end) {
      result.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [startDate, endDate]);

  const handleDragStart = useCallback((slot: string) => {
    setSelectedSlots((prev) => {
      const willAdd = !prev.has(slot);
      setDragAction(willAdd ? "add" : "remove");
      const next = new Set(prev);
      willAdd ? next.add(slot) : next.delete(slot);
      return next;
    });
  }, []);

  const handleDragEnter = useCallback(
    (slot: string) => {
      setSelectedSlots((prev) => {
        const next = new Set(prev);
        dragAction === "add" ? next.add(slot) : next.delete(slot);
        return next;
      });
    },
    [dragAction]
  );

  const selectAll = () => {
    const all = new Set<string>();
    for (const date of dates) {
      for (const hour of HOURS) {
        all.add(slotKey(date, hour));
      }
    }
    setSelectedSlots(all);
  };

  const selectNone = () => {
    setSelectedSlots(new Set());
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedSlots.size === 0) return;
    const result = await createEvent({
      name: name.trim(),
      description: description.trim(),
      slots: Array.from(selectedSlots).sort(),
    });
    setCreatedEvent(result);
  };

  if (createdEvent) {
    const base = window.location.href.split("#")[0];
    const voteUrl = `${base}#/vote/${createdEvent.quickId}`;
    const viewUrl = `${base}#/view/${createdEvent.quickId}/${createdEvent.modKey}`;
    return (
      <div className="app">
        <div className="created-result">
          <h2>Event Created!</h2>
          <p>Share this link for voting:</p>
          <a href={voteUrl}>{voteUrl}</a>
          <p>View results:</p>
          <a href={viewUrl}>{viewUrl}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Create Event</h1>
      <div className="create-form">
        <div className="form-group">
          <label>Event Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Team Dinner"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
          />
        </div>
        <div className="date-range">
          <div className="form-group">
            <label>From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: 8,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span style={{ color: "#666" }}>
          Click or drag to select time slots.
        </span>
        <button
          onClick={selectAll}
          style={{ fontSize: 12, padding: "4px 8px" }}
        >
          Select All
        </button>
        <button
          onClick={selectNone}
          style={{ fontSize: 12, padding: "4px 8px" }}
        >
          Clear
        </button>
      </div>

      <TimeGrid
        dates={dates}
        getCellStyle={(slot) => ({
          backgroundColor: selectedSlots.has(slot) ? "#3b82f6" : "#e5e7eb",
        })}
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onColumnHeaderClick={(date) => {
          setSelectedSlots((prev) => {
            const colSlots = HOURS.map((h) => slotKey(date, h));
            const allSelected = colSlots.every((s) => prev.has(s));
            const next = new Set(prev);
            for (const s of colSlots) {
              allSelected ? next.delete(s) : next.add(s);
            }
            return next;
          });
        }}
      />

      <button
        onClick={handleCreate}
        disabled={!name.trim() || selectedSlots.size === 0}
        style={{ marginTop: 16 }}
      >
        Create Event
      </button>
    </div>
  );
}
