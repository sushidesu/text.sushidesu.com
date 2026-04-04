import { css } from "hono/css";
import type { FC } from "hono/jsx";

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
        <a
          href={"/"}
          class={css`
            color: var(--color-text-link);
          `}
        >
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
      <div>links</div>
    </div>
  );
};
