import React from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useRafMousePosition } from '../../hooks/useRafMousePosition';

export function CursorGlow() {
  const { x, y } = useRafMousePosition();
  const cursorX = useSpring(x, { stiffness: 500, damping: 28 });
  const cursorY = useSpring(y, { stiffness: 500, damping: 28 });

  return (
    <motion.div
      className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none -z-10"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    />
  );
}
