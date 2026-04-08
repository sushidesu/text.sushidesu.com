import { css } from "hono/css";
import type { FC } from "hono/jsx";

export const Footer: FC = () => {
  return (
    <div
      class={css`
        padding: var(--space-y-lg) var(--space-x-md);
        text-align: center;
        font-size: 0.8rem;
        color: #888;
      `}
    >
      © {new Date().getFullYear()} sushidesu
    </div>
  );
};
