import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0) {
        setTouchStart(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (!touchStart || container.scrollTop > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStart);
      setPullDistance(distance);
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 80) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      setTouchStart(null);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / 80, 1);

  return (
    <div ref={containerRef} className="overflow-y-auto">
      <motion.div
        style={{ height: pullDistance }}
        className="flex items-end justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden"
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : progress * 360 }}
          transition={{ duration: 0.6, repeat: isRefreshing ? Infinity : 0 }}
        >
          <RefreshCw className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </motion.div>
      </motion.div>
      {children}
    </div>
  );
}