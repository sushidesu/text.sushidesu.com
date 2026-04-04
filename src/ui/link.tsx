import { css } from "hono/css";
import type { Child, FC } from "hono/jsx";

const linkStyle = css`
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid currentColor;
  width: fit-content;
`;

type LinkProps = {
  href: string;
  target?: string;
  rel?: string;
  "aria-label"?: string;
  children: Child;
};

export const Link: FC<LinkProps> = (props) => {
  return (
    <a class={linkStyle} {...props}>
      {props.children}
    </a>
  );
};
