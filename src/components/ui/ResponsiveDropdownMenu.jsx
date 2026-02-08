import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
} from './dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from './drawer';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { cn } from '@/lib/utils';

export function ResponsiveDropdownMenu({ children, trigger, ...props }) {
  const [open, setOpen] = useState(false);
  const isMobile = !useMediaQuery('(min-width: 1024px)');

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'flex items-center justify-center min-h-[44px] min-w-[44px] select-none',
            'rounded-md text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {trigger}
        </button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[70vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Options</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-4 space-y-1">
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} {...props}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
};