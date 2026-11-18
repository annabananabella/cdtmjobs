import { describe, expect, it } from "vitest";
import { personNameFromEmail } from "@/lib/contact-name";

describe("personNameFromEmail", () => {
  it("reads a full name from a dotted address", () => {
    expect(personNameFromEmail("jane.doe@example.com")).toBe(
      "Jane Doe",
    );
    expect(personNameFromEmail("max.mustermann@example.de")).toBe("Max Mustermann");
    expect(personNameFromEmail("erika.musterfrau@example.org")).toBe(
      "Erika Musterfrau",
    );
  });

  it("reads a first name from a single-word address", () => {
    expect(personNameFromEmail("lena@example.io")).toBe("Lena");
    expect(personNameFromEmail("tom@example.ai")).toBe("Tom");
  });

  it("ignores the +suffix and the case of the address", () => {
    expect(personNameFromEmail("Leonie.Wagner+cdtm@CDTM.COM")).toBe(
      "Leonie Wagner",
    );
  });

  it("returns null for shared mailboxes and non-persons", () => {
    expect(personNameFromEmail("info@samplecorp.example")).toBeNull();
    expect(personNameFromEmail("hello@samplecorp.example")).toBeNull();
    expect(personNameFromEmail("no-reply@samplecorp.example")).toBeNull();
    // samplecorp@samplecorp.example style: initials or the company itself
    expect(personNameFromEmail("jd@samplecorp.example")).toBeNull();
    expect(personNameFromEmail("samplecorp@samplecorp.example")).toBeNull();
  });

  it("returns null for anything that is not a usable address", () => {
    expect(personNameFromEmail("")).toBeNull();
    expect(personNameFromEmail("jane123@samplecorp.example")).toBeNull();
    expect(personNameFromEmail("j@samplecorp.example")).toBeNull();
    expect(personNameFromEmail("no-at-sign")).toBeNull();
  });
});
