import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

/**
 * ThemeToggle - Dark/Light mode toggle with system preference
 */

const THEME_KEY = 'constructflow-theme';

export function useTheme() {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      let resolved;
      
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      
      setResolvedTheme(resolved);
      
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setThemeValue = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    
    const themeNames = {
      light: 'Light mode',
      dark: 'Dark mode',
      system: 'System preference',
    };
    
    toast.success(`${themeNames[newTheme]} enabled`, {
      description: 'Your theme preference has been saved',
    });
  };

  return { theme, setTheme: setThemeValue, resolvedTheme };
}

export function ThemeToggle({ 
  variant = 'outline',
  size = 'icon',
  className = '' 
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const Icon = icons[theme] || icons.system;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`relative overflow-hidden ${className}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-slate-100 dark:bg-slate-800' : ''}
        >
          <Sun className="h-4 w-4 mr-2" />
          <span>Light</span>
          {theme === 'light' && (
            <motion.div 
              layoutId="check"
              className="ml-auto h-4 w-4 text-blue-500"
            >
              ✓
            </motion.div>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-slate-100 dark:bg-slate-800' : ''}
        >
          <Moon className="h-4 w-4 mr-2" />
          <span>Dark</span>
          {theme === 'dark' && (
            <motion.div 
              layoutId="check"
              className="ml-auto h-4 w-4 text-blue-500"
            >
              ✓
            </motion.div>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-slate-100 dark:bg-slate-800' : ''}
        >
          <Monitor className="h-4 w-4 mr-2" />
          <span>System</span>
          {theme === 'system' && (
            <motion.div 
              layoutId="check"
              className="ml-auto h-4 w-4 text-blue-500"
            >
              ✓
            </motion.div>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button (no dropdown)
export function SimpleThemeToggle({ 
  className = '' 
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative overflow-hidden ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Animated theme toggle with sun/moon rotation
export function AnimatedThemeToggle({ 
  className = '' 
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: isDark 
            ? 'linear-gradient(135deg, #1e293b, #0f172a)' 
            : 'linear-gradient(135deg, #fef3c7, #fde68a)'
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Sun */}
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 90 : 0,
          scale: isDark ? 0 : 1,
          opacity: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="absolute"
      >
        <Sun className="h-5 w-5 text-amber-500" />
      </motion.div>
      
      {/* Moon */}
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 0 : -90,
          scale: isDark ? 1 : 0,
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="absolute"
      >
        <Moon className="h-5 w-5 text-slate-300" />
      </motion.div>
      
      {/* Stars (dark mode only) */}
      <AnimatePresence>
        {isDark && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.1 }}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${20 + i * 25}%`,
                  left: `${15 + i * 30}%`,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default ThemeToggle;
