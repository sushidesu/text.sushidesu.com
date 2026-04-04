import type { Child, FC } from "hono/jsx";

type LayoutProps = {
  header: JSX.Element;
  children: Child;
};

export const Layout: FC<LayoutProps> = ({ header, children }) => {
  return (
    <div>
      <header>{header}</header>
      <main>{children}</main>
    </div>
  );
};
