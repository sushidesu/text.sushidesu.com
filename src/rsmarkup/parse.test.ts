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

  test("CRLF line endings are treated the same as LF", () => {
    expect(parse("a\r\n\r\nb")).toEqual(
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
    expect(parse("\\1 見出し \\")).toEqual(
      doc({
        type: "heading",
        level: 1,
        children: [{ type: "text", value: "見出し" }],
      }),
    );
  });

  test("h2 through h6", () => {
    for (const level of [2, 3, 4, 5, 6] as const) {
      expect(parse(`\\${level} t \\`)).toEqual(
        doc({
          type: "heading",
          level,
          children: [{ type: "text", value: "t" }],
        }),
      );
    }
  });

  test("heading-like pattern inside a paragraph is plain text", () => {
    expect(parse("before \\1 h \\ after")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "text", value: "before \\1 h \\ after" }],
      }),
    );
  });

  test("heading preserves multi-word content", () => {
    expect(parse("\\2 hello world \\")).toEqual(
      doc({
        type: "heading",
        level: 2,
        children: [{ type: "text", value: "hello world" }],
      }),
    );
  });

  test("level 7 is not a heading (falls through)", () => {
    const result = parse("\\7 text \\");
    expect(result.children[0]?.type).not.toBe("heading");
  });
});

describe("parse: inline link", () => {
  test("bare URL (no label)", () => {
    expect(parse("\\@ https://example.com \\")).toEqual(
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
    expect(parse("\\@ https://example.com example \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "link", url: "https://example.com", label: "example" },
        ],
      }),
    );
  });

  test("label with multiple words", () => {
    expect(parse("\\@ https://example.com hello world \\")).toEqual(
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
    expect(parse("\\@ http://example.com \\")).toEqual(
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
    expect(parse(`\\@ ${url} \\`)).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "link", url, label: url }],
      }),
    );
  });

  test("link surrounded by text in a paragraph", () => {
    expect(parse("前 \\@ https://example.com ex \\ 後")).toEqual(
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
      parse("\\@ https://a.example \\ と \\@ https://b.example b \\"),
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
});

describe("parse: inline code", () => {
  test("simple inline code", () => {
    expect(parse("\\! hoge \\")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "inlineCode", value: "hoge" }],
      }),
    );
  });

  test("inline code with multiple words", () => {
    expect(parse("\\! const x = 1 \\")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "inlineCode", value: "const x = 1" }],
      }),
    );
  });

  test("inline code surrounded by text", () => {
    expect(parse("前 \\! code \\ 後")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "text", value: "前 " },
          { type: "inlineCode", value: "code" },
          { type: "text", value: " 後" },
        ],
      }),
    );
  });

  test("inline code containing a single backslash", () => {
    expect(parse("\\! \\ \\ なので \\! hoge \\ です")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "inlineCode", value: "\\" },
          { type: "text", value: " なので " },
          { type: "inlineCode", value: "hoge" },
          { type: "text", value: " です" },
        ],
      }),
    );
  });

  test("inline code inside list item", () => {
    const src = ["\\-", "\\! foo \\", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "list",
        items: [
          {
            type: "listItem",
            children: [{ type: "inlineCode", value: "foo" }],
          },
        ],
      }),
    );
  });
});

describe("parse: variable fence (inline)", () => {
  test("depth-2 inline code contains a literal depth-1 closer", () => {
    expect(parse("\\\\! \\2 見出し \\ \\\\")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "inlineCode", value: "\\2 見出し \\" }],
      }),
    );
  });

  test("depth-2 inline link contains a literal depth-1 closer", () => {
    expect(parse("\\\\@ https://example.com \\ \\\\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "https://example.com",
            label: "\\",
          },
        ],
      }),
    );
  });

  test("depth-3 inline code contains literal depth-2 content", () => {
    expect(parse("\\\\\\! \\\\! code \\ \\\\ \\\\\\")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "inlineCode", value: "\\\\! code \\ \\\\" }],
      }),
    );
  });

  test("depth-1 closer is not confused by a literal double backslash", () => {
    expect(parse("\\! a\\\\b \\")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "inlineCode", value: "a\\\\b" }],
      }),
    );
  });

  test("depth-2 inline code inside a list item", () => {
    const src = ["\\-", "見出し \\\\! \\2 見出し \\ \\\\", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "list",
        items: [
          {
            type: "listItem",
            children: [
              { type: "text", value: "見出し " },
              { type: "inlineCode", value: "\\2 見出し \\" },
            ],
          },
        ],
      }),
    );
  });
});

describe("parse: unknown inline type", () => {
  test("unknown inline TYPE char is treated as literal text", () => {
    expect(parse("\\x foo \\")).toEqual(
      doc({
        type: "paragraph",
        children: [{ type: "text", value: "\\x foo \\" }],
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
    const src = ["\\-", "\\@ https://example.com ex \\", "plain", "\\"].join(
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
    const src = ["\\! ts", "const x = 0", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({ type: "code", lang: "ts", content: "const x = 0" }),
    );
  });

  test("code without language", () => {
    const src = ["\\!", "raw", "\\"].join("\n");
    expect(parse(src)).toEqual(doc({ type: "code", lang: "", content: "raw" }));
  });

  test("code preserves multiple lines and indentation", () => {
    const src = ["\\! ts", "function f() {", "  return 1", "}", "\\"].join(
      "\n",
    );
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "ts",
        content: "function f() {\n  return 1\n}",
      }),
    );
  });

  test("code does not parse inline commands inside", () => {
    const src = ["\\! ts", "\\@ https://example.com \\", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "ts",
        content: "\\@ https://example.com \\",
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
    const src = ["\\! ts", "const x = 0"].join("\n");
    expect(parse(src)).toEqual(
      doc({ type: "code", lang: "ts", content: "const x = 0" }),
    );
  });

  test("empty code block", () => {
    const src = ["\\!", "\\"].join("\n");
    expect(parse(src)).toEqual(doc({ type: "code", lang: "", content: "" }));
  });
});

describe("parse: variable fence (code block)", () => {
  test("depth-2 code block contains a literal backslash line", () => {
    const src = ["\\\\!", "\\TYPE", "content", "\\", "\\\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "",
        content: "\\TYPE\ncontent\n\\",
      }),
    );
  });

  test("depth-2 code block with language", () => {
    const src = ["\\\\! ts", "\\", "\\\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "ts",
        content: "\\",
      }),
    );
  });

  test("depth-3 code block", () => {
    const src = ["\\\\\\!", "\\\\", "x", "\\\\\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "",
        content: "\\\\\nx",
      }),
    );
  });

  test("depth-1 closer inside depth-2 block is content", () => {
    const src = ["\\\\!", "\\", "\\", "\\\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "",
        content: "\\\n\\",
      }),
    );
  });

  test("depth-2 code block auto-closes at EOF", () => {
    const src = ["\\\\!", "x"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "code",
        lang: "",
        content: "x",
      }),
    );
  });
});

describe("parse: variable fence (list block)", () => {
  test("depth-2 list with literal backslash item", () => {
    const src = ["\\\\-", "a", "\\", "b", "\\\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "list",
        items: [
          { type: "listItem", children: [{ type: "text", value: "a" }] },
          { type: "listItem", children: [{ type: "text", value: "\\" }] },
          { type: "listItem", children: [{ type: "text", value: "b" }] },
        ],
      }),
    );
  });
});

describe("parse: mixed blocks", () => {
  test("heading, paragraph, list, code in sequence", () => {
    const src = [
      "\\1 タイトル \\",
      "",
      "導入の段落。",
      "2行目。",
      "",
      "\\-",
      "foo",
      "bar",
      "\\",
      "",
      "\\! ts",
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

describe("parse: inline image", () => {
  test("inline image with src only", () => {
    expect(parse("\\i abc123 \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "inlineImage", src: "abc123", alt: "", options: {} },
        ],
      }),
    );
  });

  test("inline image with alt text", () => {
    expect(parse("\\i abc123 スクショ \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "inlineImage", src: "abc123", alt: "スクショ", options: {} },
        ],
      }),
    );
  });

  test("inline image surrounded by text", () => {
    expect(parse("前 \\i abc123 画像 \\ 後")).toEqual(
      doc({
        type: "paragraph",
        children: [
          { type: "text", value: "前 " },
          { type: "inlineImage", src: "abc123", alt: "画像", options: {} },
          { type: "text", value: " 後" },
        ],
      }),
    );
  });

  test("inline image with multi-word alt", () => {
    expect(parse("\\i abc123 hello world \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          {
            type: "inlineImage",
            src: "abc123",
            alt: "hello world",
            options: {},
          },
        ],
      }),
    );
  });

  test("inline image with option after alt", () => {
    expect(parse("\\i abc123 画像 w=50% \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          {
            type: "inlineImage",
            src: "abc123",
            alt: "画像",
            options: { displayWidth: "50%" },
          },
        ],
      }),
    );
  });

  test("inline image with displayWidth option", () => {
    expect(parse("\\i abc123 w=50% 画像 \\")).toEqual(
      doc({
        type: "paragraph",
        children: [
          {
            type: "inlineImage",
            src: "abc123",
            alt: "画像",
            options: { displayWidth: "50%" },
          },
        ],
      }),
    );
  });
});

describe("parse: image block", () => {
  test("image with alt and caption", () => {
    const src = ["\\i abc123 説明", "キャプション", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "image",
        src: "abc123",
        alt: "説明",
        options: {},
        caption: [{ type: "text", value: "キャプション" }],
      }),
    );
  });

  test("image without alt", () => {
    const src = ["\\i abc123", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({ type: "image", src: "abc123", alt: "", options: {}, caption: [] }),
    );
  });

  test("image with multi-word alt", () => {
    const src = ["\\i abc123 hello world", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "image",
        src: "abc123",
        alt: "hello world",
        options: {},
        caption: [],
      }),
    );
  });

  test("image with displayWidth option", () => {
    const src = ["\\i abc123 w=50% 説明", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "image",
        src: "abc123",
        alt: "説明",
        options: { displayWidth: "50%" },
        caption: [],
      }),
    );
  });

  test("image with multi-line caption produces line breaks", () => {
    const src = ["\\i abc123 説明", "1行目", "2行目", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "image",
        src: "abc123",
        alt: "説明",
        options: {},
        caption: [
          { type: "text", value: "1行目" },
          { type: "lineBreak" },
          { type: "text", value: "2行目" },
        ],
      }),
    );
  });

  test("image caption supports inline link", () => {
    const src = [
      "\\i abc123 説明",
      "出典: \\@ https://example.com ex \\",
      "\\",
    ].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "image",
        src: "abc123",
        alt: "説明",
        options: {},
        caption: [
          { type: "text", value: "出典: " },
          { type: "link", url: "https://example.com", label: "ex" },
        ],
      }),
    );
  });

  test("image without src is not an image (paragraph fallback)", () => {
    const src = ["\\i", "x", "\\"].join("\n");
    const result = parse(src);
    expect(result.children[0]?.type).toBe("paragraph");
  });

  test("image src is opaque (URL accepted as-is)", () => {
    const src = ["\\i https://example.com/x.webp", "\\"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "image",
        src: "https://example.com/x.webp",
        alt: "",
        options: {},
        caption: [],
      }),
    );
  });

  test("image without closing backslash auto-closes at EOF", () => {
    const src = ["\\i abc123 説明", "cap"].join("\n");
    expect(parse(src)).toEqual(
      doc({
        type: "image",
        src: "abc123",
        alt: "説明",
        options: {},
        caption: [{ type: "text", value: "cap" }],
      }),
    );
  });
});

describe("parse: unknown block type", () => {
  test("unknown block-like line is treated as plain text", () => {
    const src = ["\\?", "content", "\\"].join("\n");
    const result = parse(src);
    expect(result.children[0]?.type).toBe("paragraph");
  });
});
