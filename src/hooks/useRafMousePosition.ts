import { useState, useEffect, useRef } from 'react';

export function useRafMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const requestRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const updatePosition = () => {
      setMousePosition({ x: mouseRef.current.x, y: mouseRef.current.y });
      requestRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    requestRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return mousePosition;
}
