import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./MaskText.css";

const MaskText = ({ text, className = "", delay = 0, tag = "h1" }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");
  const Tag = tag;

  return (
    <Tag ref={ref} className={`mask-text ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="mask-text__word-wrapper">
          <motion.span
            className="mask-text__word"
            initial={{ y: "110%" }}
            animate={isVisible ? { y: "0%" } : { y: "110%" }}
            transition={{
              duration: 0.6,
              delay: delay + i * 0.08,
              ease: [0.215, 0.61, 0.355, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}

      {/* Gradient overlay mask */}
      <motion.div
        className="mask-text__gradient-overlay"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: delay + words.length * 0.08 }}
      />
    </Tag>
  );
};

export default MaskText;