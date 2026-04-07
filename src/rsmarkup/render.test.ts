import { describe, expect, test } from "vitest";
import { parse } from "./parse";
import { render } from "./render";

const r = (src: string) => render(parse(src));

describe("render", () => {
  test("empty document", () => {
    expect(r("")).toBe("");
  });

  test("paragraph", () => {
    expect(r("hello")).toBe("<p>hello</p>");
  });

  test("paragraph with line break", () => {
    expect(r("a\nb")).toBe("<p>a<br>b</p>");
  });

  test("two paragraphs", () => {
    expect(r("a\n\nb")).toBe("<p>a</p><p>b</p>");
  });

  test("two Japanese paragraphs", () => {
    expect(r("こんにちは\n\nこんにちは")).toBe(
      "<p>こんにちは</p><p>こんにちは</p>",
    );
  });

  test("heading levels 1-6", () => {
    for (let level = 1; level <= 6; level++) {
      expect(r(`\\${level} t \\`)).toBe(`<h${level}>t</h${level}>`);
    }
  });

  test("link bare", () => {
    expect(r("\\@ https://example.com \\")).toBe(
      '<p><a href="https://example.com">https://example.com</a></p>',
    );
  });

  test("link with label", () => {
    expect(r("\\@ https://example.com ex \\")).toBe(
      '<p><a href="https://example.com">ex</a></p>',
    );
  });

  test("link surrounded by text", () => {
    expect(r("前 \\@ https://example.com ex \\ 後")).toBe(
      '<p>前 <a href="https://example.com">ex</a> 後</p>',
    );
  });

  test("inline code", () => {
    expect(r("\\! hoge \\")).toBe("<p><code>hoge</code></p>");
  });

  test("inline code containing a single backslash", () => {
    expect(r("\\! \\ \\ なので \\! hoge \\ です")).toBe(
      "<p><code>\\</code> なので <code>hoge</code> です</p>",
    );
  });

  test("inline code escapes html", () => {
    expect(r("\\! <div> \\")).toBe("<p><code>&lt;div&gt;</code></p>");
  });

  test("list", () => {
    const src = ["\\-", "a", "b", "\\"].join("\n");
    expect(r(src)).toBe("<ul><li>a</li><li>b</li></ul>");
  });

  test("list item with link", () => {
    const src = ["\\-", "\\@ https://example.com ex \\", "\\"].join("\n");
    expect(r(src)).toBe(
      '<ul><li><a href="https://example.com">ex</a></li></ul>',
    );
  });

  test("code block with language", () => {
    const src = ["\\! ts", "const x = 0", "\\"].join("\n");
    expect(r(src)).toBe(
      '<pre><code class="language-ts">const x = 0</code></pre>',
    );
  });

  test("code block without language", () => {
    const src = ["\\!", "raw", "\\"].join("\n");
    expect(r(src)).toBe("<pre><code>raw</code></pre>");
  });

  test("code block preserves newlines and does not parse inline", () => {
    const src = ["\\! ts", "\\@ https://example.com \\", "next", "\\"].join(
      "\n",
    );
    expect(r(src)).toBe(
      '<pre><code class="language-ts">\\@ https://example.com \\\nnext</code></pre>',
    );
  });

  test("escapes html in text", () => {
    expect(r("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });

  test("escapes html in link url and label", () => {
    expect(r('\\@ https://ex.com/?a="b" <x> \\')).toBe(
      '<p><a href="https://ex.com/?a=&quot;b&quot;">&lt;x&gt;</a></p>',
    );
  });

  test("escapes html in code block content", () => {
    const src = ["\\!", "<div>&</div>", "\\"].join("\n");
    expect(r(src)).toBe("<pre><code>&lt;div&gt;&amp;&lt;/div&gt;</code></pre>");
  });

  test("mixed document", () => {
    const src = [
      "\\1 タイトル \\",
      "",
      "段落1。",
      "2行目。",
      "",
      "\\-",
      "foo",
      "bar",
      "\\",
    ].join("\n");
    expect(r(src)).toBe(
      "<h1>タイトル</h1><p>段落1。<br>2行目。</p><ul><li>foo</li><li>bar</li></ul>",
    );
  });
});
