import { motion } from "framer-motion";

export default function Annotation({ text, style, ...motionProps }) {
  return (
    <motion.p
      style={{
        fontSize: "0.875rem",
        color: "var(--accent)",
        fontStyle: "italic",
        textAlign: "center",
        maxWidth: 320,
        ...style,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.3 }}
      {...motionProps}
    >
      {text}
    </motion.p>
  );
}
