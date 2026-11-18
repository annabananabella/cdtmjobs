import { expect, it } from "vitest";
import { companySummaries, companySummary } from "./company-summaries";

it("keeps company descriptions strictly below 10 words", () => {
  for (const summary of Object.values(companySummaries)) {
    expect(summary.trim().split(/\s+/).length).toBeLessThan(10);
  }
});

it("resolves informative company-name suffixes without inventing unknown summaries", () => {
  const summaries = { samplecorp: "Sample summary.", demoworks: "Another summary." };
  expect(companySummary("Samplecorp GmbH", summaries)).toBe("Sample summary.");
  expect(companySummary("Demoworks (YC S24)", summaries)).toBe("Another summary.");
  expect(companySummary("Unknown company", summaries)).toBeUndefined();
});
