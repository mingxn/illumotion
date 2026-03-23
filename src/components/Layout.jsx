import { Outlet, Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="layout">
      <header className="site-header">
        <Link to="/" className="logo">
          illumotion
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
