import { expect, it } from "vitest";
import { locationCountryLabel } from "./location-country";

it("preserves USA in location filter labels", () => {
  for (const country of ["USA", "Usa", "usa", "US", "United States"]) {
    expect(locationCountryLabel(country)).toBe("USA");
  }
});

it("uses Germany consistently", () => {
  for (const country of ["Germany", "DE", "Deutschland"]) {
    expect(locationCountryLabel(country)).toBe("Germany");
  }
});