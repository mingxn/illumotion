import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home({ pages }) {
  return (
    <div className="home">
      <h1>illumotion</h1>
      <p className="tagline">Concepts explained through illustration + motion.</p>

      <div className="page-grid">
        {pages.map(({ path, title }, i) => (
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={path} className="page-card">
              {title}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
