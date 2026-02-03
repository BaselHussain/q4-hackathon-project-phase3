'use client';

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { useThemeAwareColors } from '@/hooks/useThemeAwareColors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ThemeToggle from '@/components/ThemeToggle';

const ThemeTestComponent: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { getColorForContrast } = useThemeAwareColors();

  // Test accessibility contrast
  const textOnBgColor = getColorForContrast('primary', 'text');
  const bgWithGoodContrast = getColorForContrast('primary', 'background');
  const borderColor = getColorForContrast('primary', 'border');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Theme Management Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Info */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div>
            <h3 className="font-medium">Current Theme</h3>
            <p className="text-2xl font-bold capitalize">{theme}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">System Preference:</span>
            <span className="font-mono bg-background px-2 py-1 rounded text-sm">
              {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}
            </span>
          </div>
        </div>

        {/* Theme Controls */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={toggleTheme} variant={theme === 'light' ? 'outline' : 'secondary'}>
            Toggle Theme
          </Button>
          <Button onClick={() => setTheme('light')} variant={theme === 'light' ? 'primary' : 'outline'}>
            Light Mode
          </Button>
          <Button onClick={() => setTheme('dark')} variant={theme === 'dark' ? 'primary' : 'outline'}>
            Dark Mode
          </Button>
          <ThemeToggle />
        </div>

        {/* Contrast Test */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: bgWithGoodContrast,
              color: textOnBgColor,
              borderColor: borderColor
            }}
          >
            <h4 className="font-medium mb-2">Text Contrast</h4>
            <p>This text has proper contrast ratio against the background</p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-background">
            <h4 className="font-medium mb-2">Background Test</h4>
            <p className="text-foreground">This is foreground text on background</p>
            <p className="text-muted-foreground">This is muted text on background</p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card">
            <h4 className="font-medium mb-2">Card Background</h4>
            <p className="text-card-foreground">This is card foreground text</p>
          </div>
        </div>

        {/* Color Palette Test */}
        <div className="space-y-3">
          <h4 className="font-medium">Theme Colors Applied:</h4>
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm">Primary</div>
            <div className="px-3 py-2 rounded bg-secondary text-secondary-foreground text-sm">Secondary</div>
            <div className="px-3 py-2 rounded bg-muted text-muted-foreground text-sm">Muted</div>
            <div className="px-3 py-2 rounded bg-accent text-accent-foreground text-sm">Accent</div>
            <div className="px-3 py-2 rounded bg-destructive text-destructive-foreground text-sm">Destructive</div>
          </div>
        </div>

        {/* System Preference Detection */}
        <div className="p-4 bg-background border rounded-lg">
          <h4 className="font-medium mb-2">System Preference Detection</h4>
          <p className="text-sm text-muted-foreground">
            The theme manager detects your system preference and applies it by default.
            Current system preference: <span className="font-medium">{window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeTestComponent;