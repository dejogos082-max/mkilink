import React from 'react';
import { motion } from 'motion/react';
import { useRafMousePosition } from '../hooks/useRafMousePosition';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export const CursorGlow: React.FC = () => {
  const { x, y } = useRafMousePosition();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      animate={{
        background: `radial-gradient(600px circle at ${x}px ${y}px, rgba(99, 102, 241, 0.08), transparent 40%)`,
      }}
      transition={{ type: 'tween', ease: 'linear', duration: 0 }}
    />
  );
};
