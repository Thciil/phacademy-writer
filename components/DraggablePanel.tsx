'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface DraggablePanelProps {
  children: React.ReactNode;
  /** Optional drag handle. If not provided, the whole panel header area is draggable. */
  dragHandle?: React.ReactNode;
  /** Initial position. Default: centered-ish on screen. */
  defaultPosition?: { x: number; y: number };
  className?: string;
}

export function DraggablePanel({
  children,
  dragHandle,
  defaultPosition,
  className = '',
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition ?? { x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        left: position.x,
        top: position.y,
      };
    },
    [position]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        left: position.x,
        top: position.y,
      };
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({
        x: dragStart.current.left + dx,
        y: dragStart.current.top + dy,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      setPosition({
        x: dragStart.current.left + dx,
        y: dragStart.current.top + dy,
      });
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const handle = dragHandle ?? (
    <span className="text-gray-400 select-none" aria-hidden>
      ⋮⋮
    </span>
  );

  return (
    <div
      className={`fixed z-10 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden ${className}`}
      style={{
        left: position.x,
        top: position.y,
        maxWidth: 'calc(100vw - 2rem)',
        width: 'min(28rem, calc(100vw - 2rem))',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
        }}
        className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50 cursor-grab active:cursor-grabbing select-none touch-none"
        aria-label="Drag to move panel"
      >
        {handle}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
