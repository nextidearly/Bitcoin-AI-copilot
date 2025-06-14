'use client';

import { useEffect, useState } from 'react';

import { MonitorSmartphone, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';


export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
      }}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
      aria-label="Toggle theme"
      title={`Current theme: ${theme}`}
    >
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
      {theme === 'system' && <MonitorSmartphone className="h-4 w-4" />}
    </button>
  );
}
