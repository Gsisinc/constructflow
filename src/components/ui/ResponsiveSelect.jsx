import React, { useState } from 'react';
import {
  Select as SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
} from './select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from './drawer';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function ResponsiveSelect({ children, value, onValueChange, trigger, ...props }) {
  const [open, setOpen] = useState(false);
  const isMobile = !useMediaQuery('(min-width: 1024px)');

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
        >
          {trigger || <SelectValue />}
        </button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[70vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Select Option</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-4 space-y-2">
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <SelectRoot value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen} {...props}>
      <SelectTrigger>{trigger || <SelectValue />}</SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </SelectRoot>
  );
}

export { SelectLabel, SelectGroup, SelectItem, SelectSeparator };