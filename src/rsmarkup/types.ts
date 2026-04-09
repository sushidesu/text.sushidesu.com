export type Document = {
  type: "document";
  children: Block[];
};

export type Block = Paragraph | Heading | List | CodeBlock | Image;

export type Paragraph = {
  type: "paragraph";
  children: Inline[];
};

export type Heading = {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: Inline[];
};

export type List = {
  type: "list";
  items: ListItem[];
};

export type ListItem = {
  type: "listItem";
  children: Inline[];
};

export type CodeBlock = {
  type: "code";
  lang: string;
  content: string;
};

export type ImageOptions = {
  displayWidth?: string;
};

export type Image = {
  type: "image";
  src: string;
  alt: string;
  options: ImageOptions;
  srcset?: string;
  width?: number;
  height?: number;
  caption: Inline[];
};

export type Inline = Text | Link | LineBreak | InlineCode | InlineImage;

export type Text = {
  type: "text";
  value: string;
};

export type Link = {
  type: "link";
  url: string;
  label: string;
};

export type LineBreak = {
  type: "lineBreak";
};

export type InlineCode = {
  type: "inlineCode";
  value: string;
};

export type InlineImage = {
  type: "inlineImage";
  src: string;
  alt: string;
  options: ImageOptions;
  srcset?: string;
  width?: number;
  height?: number;
};
