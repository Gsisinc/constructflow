import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
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
  const context = React.useContext(ThemeContext);
  
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
          className={`relative overflow-hidden h-8 sm:h-9 px-1.5 sm:px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 ${className}`}
          title="Change theme"
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
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={() => handleThemeChange('light')}
          className="cursor-pointer"
        >
          <Sun className="h-4 w-4 mr-2" />
          <span className="flex-1">Light</span>
          {theme === 'light' && (
            <Check className="h-4 w-4 ml-auto text-blue-600" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('dark')}
          className="cursor-pointer"
        >
          <Moon className="h-4 w-4 mr-2" />
          <span className="flex-1">Dark</span>
          {theme === 'dark' && (
            <Check className="h-4 w-4 ml-auto text-blue-600" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('system')}
          className="cursor-pointer"
        >
          <Monitor className="h-4 w-4 mr-2" />
          <span className="flex-1">System</span>
          {theme === 'system' && (
            <Check className="h-4 w-4 ml-auto text-blue-600" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
