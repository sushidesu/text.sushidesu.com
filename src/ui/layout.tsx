import { css } from "hono/css";
import type { Child, FC } from "hono/jsx";
import { Footer } from "./footer";

type LayoutProps = {
  header: JSX.Element;
  children: Child;
};

const layoutStyle = css`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const mainStyle = css`
  flex: 1;
`;

export const Layout: FC<LayoutProps> = ({ header, children }) => {
  return (
    <div class={layoutStyle}>
      <header>{header}</header>
      <main class={mainStyle}>{children}</main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
};
