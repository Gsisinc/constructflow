import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeContext } from '@/lib/ThemeContext';
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

export function ThemeToggle({ 
  variant = 'outline',
  size = 'icon',
  className = '' 
}) {
  const context = useContext(ThemeContext);
  
  if (!context) {
    // Fallback if context not available
    return null;
  }

  const { theme, setTheme } = context;

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    const themeNames = {
      light: 'Light mode',
      dark: 'Dark mode',
      system: 'System preference',
    };
    
    toast.success(`${themeNames[newTheme]} enabled`, {
      description: 'Your theme preference has been saved',
    });
  };

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
          onClick={() => handleThemeChange('light')}
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
          onClick={() => handleThemeChange('dark')}
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
          onClick={() => handleThemeChange('system')}
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

export default ThemeToggle;
