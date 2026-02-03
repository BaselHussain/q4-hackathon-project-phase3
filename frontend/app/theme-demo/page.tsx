'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ThemeDemoPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Theme Demo</h1>
          <p className="text-muted-foreground mt-2">Dark theme — all components</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary" className="ml-2">Secondary</Button>
              <Button variant="outline" className="ml-2">Outline</Button>
              <Button variant="ghost" className="ml-2">Ghost</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 rounded bg-primary text-primary-foreground">Primary</div>
                <div className="p-2 rounded bg-secondary text-secondary-foreground">Secondary</div>
                <div className="p-2 rounded bg-destructive text-destructive-foreground">Destructive</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Background & Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 rounded border border-border bg-background text-foreground">Background</div>
                <div className="p-2 rounded border border-border bg-card text-card-foreground">Card</div>
                <div className="p-2 rounded border border-border bg-popover text-popover-foreground">Popover</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Muted & Accent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 rounded bg-muted text-muted-foreground">Muted</div>
                <div className="p-2 rounded bg-accent text-accent-foreground">Accent</div>
                <div className="p-2 rounded border border-border">Border</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Text Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-foreground">Foreground text</p>
                <p className="text-muted-foreground">Muted foreground text</p>
                <p className="text-primary">Primary text</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemoPage;
