import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }) {
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const displayValue = useTransform(spring, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals);
    }
    return Math.round(latest).toLocaleString("en-IN");
  });

  const [currentText, setCurrentText] = useState("0");

  useEffect(() => {
    spring.set(numericValue);
  }, [numericValue, spring]);

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (latest) => {
      setCurrentText(latest);
    });
    return () => unsubscribe();
  }, [displayValue]);

  return (
    <span>
      {prefix}
      {currentText}
      {suffix}
    </span>
  );
}

export default AnimatedNumber;
