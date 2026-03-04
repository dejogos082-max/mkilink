import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useRafMousePosition } from '../../hooks/useRafMousePosition';

interface Layer {
  depth: number;
  children: React.ReactNode;
}

export function MouseParallax({ layers }: { layers: Layer[] }) {
  const { x, y } = useRafMousePosition();

  return (
    <div className="relative w-full h-full">
      {layers.map((layer, i) => {
        const moveX = useTransform(x, [0, window.innerWidth], [-layer.depth, layer.depth]);
        const moveY = useTransform(y, [0, window.innerHeight], [-layer.depth, layer.depth]);

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
