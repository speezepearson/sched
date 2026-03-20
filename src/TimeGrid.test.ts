import { describe, expect, it } from "vitest";
import { generateDateRange, dateRange } from "./TimeGrid";

describe("generateDateRange", () => {
  it("includes both start and end date for a short range", () => {
    const result = generateDateRange("2024-03-15", "2024-03-18");
    expect(result).toEqual([
      "2024-03-15",
      "2024-03-16",
      "2024-03-17",
      "2024-03-18",
    ]);
  });

  it("returns a single date when start equals end", () => {
    const result = generateDateRange("2024-06-01", "2024-06-01");
    expect(result).toEqual(["2024-06-01"]);
  });
});

describe("dateRange", () => {
  it("fills in gaps between slot dates", () => {
    const slots = ["2024-03-15:10", "2024-03-18:14"];
    const result = dateRange(slots);
    expect(result).toEqual([
      "2024-03-15",
      "2024-03-16",
      "2024-03-17",
      "2024-03-18",
    ]);
  });
});
