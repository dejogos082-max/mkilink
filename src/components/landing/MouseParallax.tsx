import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRafMousePosition } from '../../hooks/useRafMousePosition';

interface Layer {
  depth: number;
  children: React.ReactNode;
}

export function MouseParallax({ layers }: { layers: Layer[] }) {
  const { x, y } = useRafMousePosition();
  const [windowSize, setWindowSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 0, height: typeof window !== 'undefined' ? window.innerHeight : 0 });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full">
      {layers.map((layer, i) => {
        const moveX = windowSize.width ? (x / windowSize.width) * (layer.depth * 2) - layer.depth : 0;
        const moveY = windowSize.height ? (y / windowSize.height) * (layer.depth * 2) - layer.depth : 0;

        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              x: moveX,
              y: moveY,
            }}
          >
            {layer.children}
          </motion.div>
        );
      })}
    </div>
  );
}
