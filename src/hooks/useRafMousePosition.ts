import { useState, useEffect, useRef } from 'react';

export function useRafMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const requestRef = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        setMousePosition({ x: event.clientX, y: event.clientY });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return mousePosition;
}
