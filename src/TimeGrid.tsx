import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function formatHour(h: number): string {
  const suffix = h < 12 ? "am" : "pm";
  const display = h > 12 ? h - 12 : h;
  return `${display}:00 ${suffix}`;
}

export function slotKey(date: string, hour: number): string {
  return `${date}:${hour}`;
}

interface TimeGridProps {
  dates: string[];
  activeSlots?: Set<string>;
  getCellStyle: (slot: string) => CSSProperties;
  getCellContent?: (slot: string) => ReactNode;
  onDragStart?: (slot: string) => void;
  onDragEnter?: (slot: string) => void;
  onDragEnd?: () => void;
  onCellMouseEnter?: (slot: string) => void;
  onCellMouseLeave?: () => void;
  onColumnHeaderClick?: (date: string) => void;
}

export default function TimeGrid({
  dates,
  activeSlots,
  getCellStyle,
  getCellContent,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onCellMouseEnter,
  onCellMouseLeave,
  onColumnHeaderClick,
}: TimeGridProps) {
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        onDragEnd?.();
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [onDragEnd]);

  return (
    <div className="time-grid" onMouseLeave={() => onCellMouseLeave?.()}>
      {dates.map((date) => {
        const d = new Date(date + "T12:00:00");
        const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
        const monthDay = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <div key={date} className="time-grid-column">
            <div
              className="time-grid-day-header"
              onClick={() => onColumnHeaderClick?.(date)}
              style={onColumnHeaderClick ? { cursor: "pointer" } : undefined}
            >
              <span className="weekday">{weekday}</span>
              <span className="date">{monthDay}</span>
            </div>
            {HOURS.map((h) => {
              const slot = slotKey(date, h);
              const isActive = !activeSlots || activeSlots.has(slot);

              if (!isActive) {
                return <div key={h} className="time-grid-cell inactive" />;
              }

              return (
                <div
                  key={h}
                  className="time-grid-cell"
                  style={getCellStyle(slot)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    isDragging.current = true;
                    onDragStart?.(slot);
                  }}
                  onMouseEnter={() => {
                    if (isDragging.current) {
                      onDragEnter?.(slot);
                    }
                    onCellMouseEnter?.(slot);
                  }}
                >
                  <span className="time-grid-cell-label">
                    {formatHour(h)}
                  </span>
                  {getCellContent?.(slot)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
