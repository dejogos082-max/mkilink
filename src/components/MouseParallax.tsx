import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface Layer {
  content: React.ReactNode;
  depth: number; // Higher number = moves more
  className?: string;
}

interface MouseParallaxProps {
  layers: Layer[];
  className?: string;
}

export const MouseParallax: React.FC<MouseParallaxProps> = ({ layers, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      
      // Calculate mouse position relative to center of container (-1 to 1)
      const x = (e.clientX - left - width / 2) / (width / 2);
      const y = (e.clientY - top - height / 2) / (height / 2);
      
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [mouseX, mouseY, prefersReducedMotion]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {layers.map((layer, index) => {
        // Calculate transform based on depth
        // Negative depth means it moves in the opposite direction of the mouse
        const x = useTransform(springX, [-1, 1], [-layer.depth, layer.depth]);
        const y = useTransform(springY, [-1, 1], [-layer.depth, layer.depth]);

        return (
          <motion.div
            key={index}
            className={`absolute inset-0 flex items-center justify-center ${layer.className || ''}`}
            style={{ x, y }}
          >
            {layer.content}
          </motion.div>
        );
      })}
    </div>
  );
};
