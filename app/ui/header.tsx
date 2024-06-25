import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Neko } from "./neko";
import { X } from "./x";

type HeaderProps = {
  isTop?: boolean;
};

export const Header: FC<HeaderProps> = ({ isTop = false }) => {
  return (
    <div
      class={css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-y-md) var(--space-x-md);
      `}
    >
      {isTop ? (
        <span
          class={css`
          font-size: 1rem;
          font-weight: bold;
        `}
        >
          text.sushidesu.com
        </span>
      ) : (
        <a href={"/"}>
          <span
            class={css`
          font-size: 1rem;
          font-weight: bold;
        `}
          >
            text.sushidesu.com
          </span>
        </a>
      )}
      <nav
        class={css`
          display: flex;
          align-items: center;
          gap: var(--space-x-md);
        `}
      >
        <a
          href={"https://sushidesu.com/about"}
          target={"_blank"}
          rel={"noopener noreferrer"}
          class={css`
            display: flex;
            gap: calc(1.6px + var(--space-x-xs));
            align-items: center;
            font-size: 0.75rem;
            font-family: var(--font-mono);
          `}
        >
          <Neko />
          <span>About</span>
        </a>
        <a
          href={"https://x.com/_sushidesu"}
          target={"_blank"}
          rel={"noopener noreferrer"}
          class={css`
            display: flex;
            gap: var(--space-x-xs);
            align-items: center;
            font-size: 0.75rem;
            font-family: var(--font-mono);
          `}
        >
          <X />
          <span>Follow me</span>
        </a>
      </nav>
    </div>
  );
};
