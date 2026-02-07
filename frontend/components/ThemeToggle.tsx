'use client';

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Use resolvedTheme for actual current theme (handles 'system' properly)
  const currentTheme = resolvedTheme || theme;

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
      className="relative rounded-full p-2 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      <motion.div
        animate={{ rotate: currentTheme === 'light' ? 0 : 180 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex h-6 w-6 items-center justify-center"
      >
        {currentTheme === 'light' ? (
          <Sun
            className="h-5 w-5 text-gray-800 dark:text-gray-200"
            aria-hidden="true"
          />
        ) : (
          <Moon
            className="h-5 w-5 text-gray-200 dark:text-gray-300"
            aria-hidden="true"
          />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;