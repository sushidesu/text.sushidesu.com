import { describe, expect, test } from "vitest";
import { excerpt } from "./textify";

describe("excerpt", () => {
  test("empty source", () => {
    expect(excerpt("")).toBe("");
  });

  test("plain paragraph", () => {
    expect(excerpt("hello world")).toBe("hello world");
  });

  test("multi-paragraph is joined with a space", () => {
    expect(excerpt("a\n\nb")).toBe("a b");
  });

  test("line break becomes space", () => {
    expect(excerpt("a\nb")).toBe("a b");
  });

  test("heading is included", () => {
    expect(excerpt("\\1 タイトル \\\n\nbody")).toBe("タイトル body");
  });

  test("link uses label", () => {
    expect(excerpt("see \\@ https://example.com example \\ here")).toBe(
      "see example here",
    );
  });

  test("inline code uses value", () => {
    expect(excerpt("use \\! hoge \\ please")).toBe("use hoge please");
  });

  test("truncates to max length with ellipsis", () => {
    const long = "a".repeat(200);
    const result = excerpt(long, 50);
    expect(result.length).toBeLessThanOrEqual(51);
    expect(result.endsWith("…")).toBe(true);
  });

  test("short string is not truncated", () => {
    expect(excerpt("short", 50)).toBe("short");
  });
});
