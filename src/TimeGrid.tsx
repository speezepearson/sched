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
  const touchActive = useRef(false);
  const lastTouchSlot = useRef<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = el?.closest<HTMLElement>("[data-slot]");
      const slot = cell?.dataset.slot ?? null;
      if (slot && slot !== lastTouchSlot.current) {
        lastTouchSlot.current = slot;
        onDragEnter?.(slot);
      }
    };
    grid.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => grid.removeEventListener("touchmove", handleTouchMove);
  }, [onDragEnter]);

  useEffect(() => {
    const handleTouchEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        lastTouchSlot.current = null;
        onDragEnd?.();
      }
      setTimeout(() => { touchActive.current = false; }, 400);
    };
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [onDragEnd]);

  return (
    <div ref={gridRef} className="time-grid" onMouseLeave={() => onCellMouseLeave?.()}>
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
                  data-slot={slot}
                  style={getCellStyle(slot)}
                  onMouseDown={(e) => {
                    if (touchActive.current) return;
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
                  onTouchStart={() => {
                    touchActive.current = true;
                    isDragging.current = true;
                    lastTouchSlot.current = slot;
                    onDragStart?.(slot);
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
