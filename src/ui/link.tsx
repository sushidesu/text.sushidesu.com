import { css } from "hono/css";
import type { Child, FC } from "hono/jsx";

type LinkProps = {
  href: string;
  target?: string;
  rel?: string;
  "aria-label"?: string;
  children: Child;
};

const textLinkStyle = css`
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.15em;
  width: fit-content;
  &:hover {
    color: var(--color-link-hover);
  }
`;

export const TextLink: FC<LinkProps> = (props) => {
  return (
    <a class={textLinkStyle} {...props}>
      {props.children}
    </a>
  );
};

const iconLinkStyle = css`
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid currentColor;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding-bottom: 1px;
  &:hover {
    color: var(--color-link-hover);
    border-bottom-color: var(--color-link-hover);
  }
`;

export const IconLink: FC<LinkProps> = (props) => {
  return (
    <a class={iconLinkStyle} {...props}>
      {props.children}
    </a>
  );
};
