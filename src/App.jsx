import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import CardTrick from "./pages/card-trick/Page";

const pages = [
  { path: "/card-trick", title: "Card Trick", component: CardTrick },
  // Add more pages here:
  // { path: "/sorting", title: "Sorting Algorithms", component: Sorting },
];

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home pages={pages} />} />
          {pages.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
