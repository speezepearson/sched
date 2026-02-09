import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import TimeGrid, { formatHour, dateRange } from "./TimeGrid.tsx";

type Rating = "great" | "good" | "fine";

interface CellAggregation {
  allCanMake: boolean;
  avgGoodness: number;
  cantCount: number;
  voterRatings: { name: string; rating: Rating | "cant" }[];
}

export default function ViewVotes({
  quickId,
  modKey,
}: {
  quickId: string;
  modKey: string;
}) {
  const event = useQuery(api.events.getByQuickId, { quickId });
  const votes = useQuery(
    api.votes.getByEvent,
    event ? { eventId: event._id, modKey } : "skip"
  );

  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [hoveredVoter, setHoveredVoter] = useState<string | null>(null);
  const [hiddenVoters, setHiddenVoters] = useState<Set<string>>(new Set());

  const activeVotes = useMemo(
    () => (votes ?? []).filter((v) => !hiddenVoters.has(v.voterName)),
    [votes, hiddenVoters]
  );

  const cellData = useMemo(() => {
    if (!event) return new Map<string, CellAggregation>();
    const result = new Map<string, CellAggregation>();

    for (const slot of event.slots) {
      const voterRatings: { name: string; rating: Rating | "cant" }[] = [];
      let totalGoodness = 0;
      let canMakeCount = 0;
      let cantCount = 0;

      for (const vote of activeVotes) {
        const found = vote.ratings.find((r) => r.slot === slot);
        const rating: Rating | "cant" = found
          ? (found.rating as Rating)
          : "cant";
        voterRatings.push({ name: vote.voterName, rating });
        if (rating !== "cant") {
          canMakeCount++;
          totalGoodness +=
            rating === "great" ? 3 : rating === "good" ? 2 : 1;
        } else {
          cantCount++;
        }
      }

      result.set(slot, {
        allCanMake: cantCount === 0 && activeVotes.length > 0,
        avgGoodness: canMakeCount > 0 ? totalGoodness / canMakeCount : 0,
        cantCount,
        voterRatings,
      });
    }
    return result;
  }, [event, activeVotes]);

  if (event === undefined || votes === undefined)
    return <div className="app">Loading...</div>;
  if (event === null) return <div className="app">Event not found.</div>;
  if (event.modKey !== modKey) return <div className="app">Invalid link.</div>;

  const slots = new Set(event.slots);
  const dates = dateRange(event.slots);

  const ratingColors: Record<string, string> = {
    great: "#22c55e",
    good: "#65a30d",
    fine: "#8B8B3B",
  };

  const getCellStyle = (slot: string): React.CSSProperties => {
    if (hoveredVoter) {
      const vote = (votes ?? []).find((v) => v.voterName === hoveredVoter);
      const found = vote?.ratings.find((r) => r.slot === slot);
      return {
        backgroundColor: found ? ratingColors[found.rating] : "#d1d5db",
      };
    }

    const data = cellData.get(slot);
    if (!data || activeVotes.length === 0) {
      return { backgroundColor: "#d1d5db" };
    }

    if (!data.allCanMake) {
      return { backgroundColor: "#d1d5db" };
    }

    // Interpolate: muddy green (avg=1) to bright green (avg=3)
    const t = Math.max(0, Math.min(1, (data.avgGoodness - 1) / 2));
    const red = Math.round(139 + (34 - 139) * t);
    const green = Math.round(139 + (197 - 139) * t);
    const blue = Math.round(59 + (94 - 59) * t);
    return { backgroundColor: `rgb(${red}, ${green}, ${blue})` };
  };

  const getCellContent = (slot: string) => {
    if (hoveredVoter) return null;
    const data = cellData.get(slot);
    if (!data || data.allCanMake) return null;

    const dots = [];
    for (let i = 0; i < data.cantCount; i++) {
      dots.push(<span key={i} className="red-dot" />);
    }
    return <span className="red-dots">{dots}</span>;
  };

  const toggleVoter = (name: string) => {
    setHiddenVoters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const renderSidebar = () => {
    if (hoveredCell && !hoveredVoter) {
      const data = cellData.get(hoveredCell);
      if (!data) return null;

      const [date, hourStr] = hoveredCell.split(":");
      const hour = parseInt(hourStr);

      return (
        <div>
          <h3>
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at {formatHour(hour)}
          </h3>
          {data.voterRatings.map(({ name, rating }) => (
            <div key={name} className="cell-detail">
              <span
                style={{
                  color: rating === "cant" ? "#ef4444" : "#16a34a",
                  fontWeight: 600,
                }}
              >
                {rating === "cant" ? "\u2717" : "\u2713"}
              </span>{" "}
              {name}:{" "}
              {rating === "cant"
                ? "Can't make it"
                : rating.charAt(0).toUpperCase() + rating.slice(1)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div>
        <h3>Voters ({(votes ?? []).length})</h3>
        {(votes ?? []).length === 0 && (
          <p style={{ color: "#999" }}>No votes yet.</p>
        )}
        {(votes ?? []).map((vote) => (
          <div
            key={vote._id}
            className="voter-item"
            onMouseEnter={() => setHoveredVoter(vote.voterName)}
            onMouseLeave={() => setHoveredVoter(null)}
          >
            <input
              type="checkbox"
              checked={!hiddenVoters.has(vote.voterName)}
              onChange={() => toggleVoter(vote.voterName)}
              className="voter-toggle"
            />
            <span className="voter-name">{vote.voterName}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app">
      <h1>{event.name}</h1>
      {event.description && (
        <p style={{ marginBottom: 16, color: "#555" }}>{event.description}</p>
      )}

      <div className="view-layout">
        <TimeGrid
          dates={dates}
          activeSlots={slots}
          getCellStyle={getCellStyle}
          getCellContent={getCellContent}
          onCellMouseEnter={(slot) => setHoveredCell(slot)}
          onCellMouseLeave={() => setHoveredCell(null)}
        />
        <div className="view-sidebar">{renderSidebar()}</div>
      </div>
    </div>
  );
}
