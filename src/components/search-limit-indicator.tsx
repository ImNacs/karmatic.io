'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiLock, FiUnlock } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface SearchLimitIndicatorProps {
  remaining: number;
  total: number;
  className?: string;
}

export function SearchLimitIndicator({ 
  remaining, 
  total, 
  className 
}: SearchLimitIndicatorProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || user) return null;

  const isLimited = remaining === 0;
  const percentage = (remaining / total) * 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          "relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full",
          "bg-gradient-to-r backdrop-blur-sm",
          "border transition-all duration-300",
          isLimited 
            ? "from-red-500/10 to-orange-500/10 border-red-500/20 dark:from-red-500/20 dark:to-orange-500/20 dark:border-red-500/30" 
            : "from-blue-500/10 to-indigo-500/10 border-blue-500/20 dark:from-blue-500/20 dark:to-indigo-500/20 dark:border-blue-500/30",
          className
        )}
      >
        {/* Icon with animation */}
        <motion.div
          animate={{ 
            rotate: isLimited ? [0, -5, 5, -5, 0] : 0,
            scale: isLimited ? [1, 1.1, 1] : 1,
          }}
          transition={{ 
            duration: 0.5,
            repeat: isLimited ? Infinity : 0,
            repeatDelay: 3,
          }}
        >
          {isLimited ? (
            <FiLock className="w-4 h-4 text-red-600 dark:text-red-400" />
          ) : (
            <FiSearch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </motion.div>

        {/* Text content */}
        <div className="flex flex-col items-start">
          <motion.span 
            className={cn(
              "text-sm font-medium",
              isLimited 
                ? "text-red-700 dark:text-red-300" 
                : "text-gray-700 dark:text-gray-300"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {isLimited ? (
              "Límite alcanzado"
            ) : (
              `${remaining} búsqueda gratuita`
            )}
          </motion.span>
          
          {!isLimited && (
            <motion.span 
              className="text-xs text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Regístrate para búsquedas ilimitadas
            </motion.span>
          )}
        </div>

        {/* Progress indicator */}
        {!isLimited && (
          <motion.div 
            className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              initial={{ width: '100%' }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </motion.div>
        )}

        {/* Unlock icon for limited state */}
        {isLimited && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FiUnlock className="w-4 h-4 text-red-600 dark:text-red-400" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}