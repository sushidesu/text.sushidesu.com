# rsmarkup

軽量マークアップ言語。バックスラッシュ `\` を唯一の特殊文字として使う。

## 設計原則

- 特殊文字は `\` のみ
- インラインとブロックの2形式
- パースは1パス、状態機械最小
- エスケープ機構なし (パターン不一致は素通し)

## 段落と改行

- 改行 (1行) → 段落内での改行 (`<br>`)
- 空行 → 段落区切り
- 連続する空行はまとめて段落区切り1回扱い
- 先頭・末尾の空行は無視

## インラインコマンド: `\ TYPE 内容 \`

開始 `\ ` (バックスラッシュ + 半角スペース)、終了 ` \` (半角スペース + バックスラッシュ)。同一行内で完結。

### 見出し

```
\ 1 見出し \     → h1
\ 2 見出し \     → h2
\ 3 見出し \     → h3
\ 4 見出し \     → h4
\ 5 見出し \     → h5
\ 6 見出し \     → h6
```

- 見出しは**単独行のとき**のみ有効 (行全体が `\ N text \` の形)
- 文中に混ざった場合は素のテキストとして扱う (素通し)
- 見出しは段落を形成しない

### リンク

```
\ https://example.com \             → <a href="...">https://example.com</a>
\ https://example.com ラベル \       → <a href="...">ラベル</a>
```

- TYPE を省略可能 (最初のトークンが `http://` または `https://` で始まるならリンク)
- スペースで区切って 第1トークン=URL、残り=ラベル
- ラベル省略時は URL をそのまま表示
- 文中のどこにでも出現可能

### 不明な TYPE

最初のトークンがリンク・数字いずれでもない場合は、コマンド全体を素のテキストとして出力する。

## ブロックコマンド: `\TYPE` … `\`

開始 `\TYPE` (バックスラッシュ直後に TYPE、スペースなし) を独立行、終了 `\` を独立行。間に複数行の内容。

### リスト `\-` … `\`

```
\-
項目1
項目2
項目3
\
```

- ブロック内の各行が1つの項目
- 項目内にはインラインコマンドを書ける
- 空行は無視
- ネスト不可

### コードブロック `\!lang` … `\`

```
\!ts
const x = 0
\
```

- `!` の後に続く文字列が言語名 (省略可 = `\!`)
- ブロック内の内容は**生のテキスト**として保持 (インラインコマンドは解釈しない)
- 空白・改行はそのまま保持

### ブロックが閉じない場合

EOF まで閉じ `\` が現れなければ、EOF で自動クローズする。

## その他

- エスケープ機構なし
- 未知のブロック TYPE (`\TYPE` だが定義されていない) は、開始行を素のテキストとして扱い、ブロックとして開かない
- コードブロック内を除き、空行はすべて段落区切り扱い

## AST

```ts
type Document = { type: "document"; children: Block[] }

type Block = Paragraph | Heading | List | CodeBlock

type Paragraph = { type: "paragraph"; children: Inline[] }
type Heading = { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: Inline[] }
type List = { type: "list"; items: ListItem[] }
type ListItem = { type: "listItem"; children: Inline[] }
type CodeBlock = { type: "code"; lang: string; content: string }

type Inline = Text | Link | LineBreak
type Text = { type: "text"; value: string }
type Link = { type: "link"; url: string; label: string }
type LineBreak = { type: "lineBreak" }
```
