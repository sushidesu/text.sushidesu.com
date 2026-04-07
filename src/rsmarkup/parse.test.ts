import { describe, expect, test } from "vitest";
import { parse } from "./parse";
import type { Document } from "./types";

const doc = (...children: Document["children"]): Document => ({
  type: "document",
  children,
});

describe("parse: empty / whitespace", () => {
  test("empty string produces empty document", () => {
    expect(parse("")).toEqual(doc());
  });

  test("only newlines produce empty document", () => {
    expect(parse("\n\n\n")).toEqual(doc());
  });
});

describe("parse: paragraph and line break", () => {
  test("single line becomes a paragraph", () => {
    expect(parse("hello")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "text", value: "hello" }],
      }),
    );
  });

  test("two lines in one paragraph are joined by a line break", () => {
    expect(parse("hello\nworld")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "text", value: "hello" },
          { type: "lineBreak" },
          { type: "text", value: "world" },
        ],
      }),
    );
  });

  test("blank line separates paragraphs", () => {
    expect(parse("a\n\nb")).toEqual(
      doc(
        { type: "paragraph", children: [{ type: "text", value: "a" }] },
        { type: "paragraph", children: [{ type: "text", value: "b" }] },
      ),
    );
  });

  test("multiple blank lines collapse to a single paragraph break", () => {
    expect(parse("a\n\n\n\nb")).toEqual(
      doc(
        { type: "paragraph", children: [{ type: "text", value: "a" }] },
        { type: "paragraph", children: [{ type: "text", value: "b" }] },
      ),
    );
  });

  test("leading and trailing blank lines are ignored", () => {
    expect(parse("\n\nhello\n\n")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "text", value: "hello" }],
      }),
    );
  });

  test("three-line paragraph has two line breaks", () => {
    expect(parse("a\nb\nc")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "text", value: "a" },
          { type: "lineBreak" },
          { type: "text", value: "b" },
          { type: "lineBreak" },
          { type: "text", value: "c" },
        ],
      }),
    );
  });
});

describe("parse: heading", () => {
  test("h1 on its own line", () => {
    expect(parse("\\ 1 見出し \\")).toEqual(
      doc({
        type: "heading",
        level: 1,
        children: [{ type: "text", value: "見出し" }],
      }),
    );
  });

  test("h2 through h6", () => {
    for (const level of [2, 3, 4, 5, 6] as const) {
      expect(parse(`\\ ${level} t \\`)).toEqual(
        doc({
          type: "heading",
          level,
          children: [{ type: "text", value: "t" }],
        }),
      );
    }
  });

  test("heading inside a paragraph line is plain text", () => {
    expect(parse("before \\ 1 h \\ after")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "text", value: "before \\ 1 h \\ after" }],
      }),
    );
  });

  test("heading preserves multi-word content", () => {
    expect(parse("\\ 2 hello world \\")).toEqual(
      doc({
        type: "heading",
        level: 2,
        children: [{ type: "text", value: "hello world" }],
      }),
    );
  });

  test("level 7 is not a heading (falls through)", () => {
    const result = parse("\\ 7 text \\");
    expect(result.children[0]?.type).not.toBe("heading");
  });
});

describe("parse: inline link", () => {
  test("bare URL in a command becomes a link", () => {
    expect(parse("\\ https://example.com \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "https://example.com",
            label: "https://example.com",
          },
        ],
      }),
    );
  });

  test("URL with label", () => {
    expect(parse("\\ https://example.com example \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "link", url: "https://example.com", label: "example" },
        ],
      }),
    );
  });

  test("label with multiple words", () => {
    expect(parse("\\ https://example.com hello world \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "https://example.com",
            label: "hello world",
          },
        ],
      }),
    );
  });

  test("http URL is accepted", () => {
    expect(parse("\\ http://example.com \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "http://example.com",
            label: "http://example.com",
          },
        ],
      }),
    );
  });

  test("URL with query and fragment", () => {
    const url = "https://example.com/path?q=1&r=2#frag";
    expect(parse(`\\ ${url} \\`)).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "link", url, label: url }],
      }),
    );
  });

  test("link surrounded by text in a paragraph", () => {
    expect(parse("前 \\ https://example.com ex \\ 後")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "text", value: "前 " },
          { type: "link", url: "https://example.com", label: "ex" },
          { type: "text", value: " 後" },
        ],
      }),
    );
  });

  test("multiple links on one line", () => {
    expect(
      parse("\\ https://a.example \\ と \\ https://b.example b \\"),
    ).toEqual(
      doc({
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "https://a.example",
            label: "https://a.example",
          },
          { type: "text", value: " と " },
          { type: "link", url: "https://b.example", label: "b" },
        ],
      }),
    );
  });

  test("unknown inline TYPE falls through as plain text", () => {
    expect(parse("\\ unknown foo \\")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "text", value: "\\ unknown foo \\" }],
      }),
    );
  });
});

describe("parse: list block", () => {
  test("simple list", () => {
    const src = ["\\-", "a", "b", "c", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "list",
        items: [
          { type: "listItem", children: [{ type: "text", value: "a" }] },
          { type: "listItem", children: [{ type: "text", value: "b" }] },
          { type: "listItem", children: [{ type: "text", value: "c" }] },
        ],
      }),
    );
  });

  test("list item with inline link", () => {
    const src = ["\\-", "\\ https://example.com ex \\", "plain", "\\"].join(
      "\n",
    );
    expect(parse(src)).toEqual(
      doc({
        type: "list",
        items: [
          {
            type: "listItem",
            children: [
              { type: "link", url: "https://example.com", label: "ex" },
            ],
          },
          {
            type: "listItem",
            children: [{ type: "text", value: "plain" }],
          },
        ],
      }),
    );
  });

  test("blank lines inside a list are ignored", () => {
    const src = ["\\-", "a", "", "b", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "list",
        items: [
          { type: "listItem", children: [{ type: "text", value: "a" }] },
          { type: "listItem", children: [{ type: "text", value: "b" }] },
        ],
      }),
    );
  });

  test("empty list", () => {
    const src = ["\\-", "\\"].join("\n");
    expect(parse(src)).toEqual(doc({ type: "list", items: [] }));
  });

  test("list without closing backslash auto-closes at EOF", () => {
    const src = ["\\-", "a", "b"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "list",
        items: [
          { type: "listItem", children: [{ type: "text", value: "a" }] },
          { type: "listItem", children: [{ type: "text", value: "b" }] },
        ],
      }),
    );
  });
});

describe("parse: code block", () => {
  test("code with language", () => {
    const src = ["\\!ts", "const x = 0", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({ type: "code", lang: "ts", content: "const x = 0" }),
    );
  });

  test("code without language", () => {
    const src = ["\\!", "raw", "\\"].join("\n");
    expect(parse(src)).toEqual(doc({ type: "code", lang: "", content: "raw" }));
  });

  test("code preserves multiple lines and indentation", () => {
    const src = ["\\!ts", "function f() {", "  return 1", "}", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "ts",
        content: "function f() {\n  return 1\n}",
      }),
    );
  });

  test("code does not parse inline commands inside", () => {
    const src = ["\\!ts", "\\ https://example.com \\", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "ts",
        content: "\\ https://example.com \\",
      }),
    );
  });

  test("code preserves blank lines inside", () => {
    const src = ["\\!", "a", "", "b", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({ type: "code", lang: "", content: "a\n\nb" }),
    );
  });

  test("code without closing backslash auto-closes at EOF", () => {
    const src = ["\\!ts", "const x = 0"].join("\n");
    expect(parse(src)).toEqual(
      doc({ type: "code", lang: "ts", content: "const x = 0" }),
    );
  });

  test("empty code block", () => {
    const src = ["\\!", "\\"].join("\n");
    expect(parse(src)).toEqual(doc({ type: "code", lang: "", content: "" }));
  });
});

describe("parse: mixed blocks", () => {
  test("heading, paragraph, list, code in sequence", () => {
    const src = [
      "\\ 1 タイトル \\",
      "",
      "導入の段落。",
      "2行目。",
      "",
      "\\-",
      "foo",
      "bar",
      "\\",
      "",
      "\\!ts",
      "const x = 1",
      "\\",
    ].join("\n");

    expect(parse(src)).toEqual(
      doc(
        {
          type: "heading",
          level: 1,
          children: [{ type: "text", value: "タイトル" }],
        },
        {
          type: "paragraph",
          children: [
            { type: "text", value: "導入の段落。" },
            { type: "lineBreak" },
            { type: "text", value: "2行目。" },
          ],
        },
        {
          type: "list",
          items: [
            { type: "listItem", children: [{ type: "text", value: "foo" }] },
            { type: "listItem", children: [{ type: "text", value: "bar" }] },
          ],
        },
        { type: "code", lang: "ts", content: "const x = 1" },
      ),
    );
  });

  test("block boundary without blank line between blocks", () => {
    const src = ["paragraph", "\\-", "item", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc(
        {
          type: "paragraph",
          children: [{ type: "text", value: "paragraph" }],
        },
        {
          type: "list",
          items: [
            { type: "listItem", children: [{ type: "text", value: "item" }] },
          ],
        },
      ),
    );
  });
});

describe("parse: unknown block type", () => {
  test("unknown block opener is treated as plain text", () => {
    const src = ["\\?", "content", "\\"].join("\n");
    // `\?` is not a defined block. The opener becomes paragraph text;
    // `content` joins it; the lone `\` closer line is also plain text.
    const result = parse(src);
    expect(result.children[0]?.type).toBe("paragraph");
  });
});
