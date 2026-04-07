# rsmarkup

軽量マークアップ言語。バックスラッシュ `\` を唯一の特殊文字として使う。

## 設計原則

- 特殊文字は `\` のみ
- TYPE は1文字の有限集合
- インラインとブロックの2形式
- パースは LL(1) 相当 (regular lexer + LL(1) parser)
- エスケープ機構なし

## TYPE 一覧

| TYPE | モード | 意味 |
|---|---|---|
| `1` 〜 `6` | インライン (行単独のみ) | 見出し |
| `@` | インライン | リンク |
| `!` | インライン + ブロック | コード |
| `-` | ブロック | リスト |

## 段落と改行

- 改行 (1行) → 段落内での改行
- 空行 → 段落区切り
- 連続する空行はまとめて段落区切り1回扱い
- 先頭・末尾の空行は無視
- CRLF/CR は LF に正規化

## インラインコマンド: `\X content \`

- 開始: バックスラッシュ + TYPE 文字 + スペース
- 終了: スペース + バックスラッシュ
- 同一行内で完結する
- 閉じが見つからない、または content が空の場合は素通し (リテラル)

### リンク `\@`

```
\@ https://example.com \          → label = URL
\@ https://example.com ラベル \   → label = "ラベル"
```

content を最初のスペースで分割し、前半を URL、後半をラベルとする。後半が空の場合はラベル = URL。

### インラインコード `\!`

```
\! hoge \   → <code>hoge</code>
```

content をそのままコード内容として扱う。インライン解釈なし、HTML エスケープのみ。

### 見出し `\1` 〜 `\6`

```
\1 見出し \   → h1
\2 見出し \   → h2
...
\6 見出し \   → h6
```

- **行全体が `\N content \` の形のときのみ**見出しとして解釈する
- 文中に混ざった場合は素のテキストとして扱う (インライン TYPE 集合に含まれないため)

## ブロックコマンド

### ブロック opener

- `\X` または `\X パラメータ` を独立行に書く
- 同じ行に閉じ ` \` を含まないこと

### ブロック closer

- `\` のみの独立行

### リスト `\-`

```
\-
項目1
項目2
\
```

- 行単独で `\-`
- 各行が1つの項目
- 項目内にはインラインコマンドを書ける
- 空行は無視
- ネスト不可

### コードブロック `\!` / `\! lang`

```
\! ts
const x = 0
\
```

- `\!` 単独 → lang なし
- `\! lang` → 言語名付き (スペース区切り)
- ブロック内の内容は生のテキストとして保持 (インラインコマンドは解釈しない)
- 空白・改行はそのまま保持

### ブロックが閉じない場合

EOF まで閉じ `\` が現れなければ、EOF で自動クローズする。

## その他

- エスケープ機構なし
- 未定義のインライン TYPE (例: `\x foo \`) は素のテキストとして扱う
- 未定義のブロック TYPE を含む行はブロックとして開かず、素のパラグラフ行として扱う

## AST

```ts
type Document = { type: "document"; children: Block[] }

type Block = Paragraph | Heading | List | CodeBlock

type Paragraph = { type: "paragraph"; children: Inline[] }
type Heading = { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: Inline[] }
type List = { type: "list"; items: ListItem[] }
type ListItem = { type: "listItem"; children: Inline[] }
type CodeBlock = { type: "code"; lang: string; content: string }

type Inline = Text | Link | LineBreak | InlineCode
type Text = { type: "text"; value: string }
type Link = { type: "link"; url: string; label: string }
type LineBreak = { type: "lineBreak" }
type InlineCode = { type: "inlineCode"; value: string }
```
