import { describe, it, expect } from "vitest";
import { fieldList, toParamValue } from "./paramForm";

describe("fieldList", () => {
  it("maps primitive defaults to kinds", () => {
    const fields = fieldList({ name: "x", count: 5, enabled: true });
    expect(fields).toEqual([
      { key: "name", kind: "text" },
      { key: "count", kind: "number" },
      { key: "enabled", kind: "checkbox" },
    ]);
  });

  it("maps objects and arrays to json", () => {
    const fields = fieldList({ nested: { a: 1 }, list: [1, 2] });
    expect(fields).toEqual([
      { key: "nested", kind: "json" },
      { key: "list", kind: "json" },
    ]);
  });
});

describe("toParamValue", () => {
  it("parses numbers and booleans", () => {
    expect(toParamValue("number", "42")).toBe(42);
    expect(toParamValue("number", "")).toBeNull();
    expect(toParamValue("checkbox", false)).toBe(false);
  });
  it("parses json strings and falls back to raw", () => {
    expect(toParamValue("json", '{"a":1}')).toEqual({ a: 1 });
    expect(toParamValue("json", "not-json")).toBe("not-json");
  });
  it("passes text through", () => {
    expect(toParamValue("text", "hello")).toBe("hello");
  });
});