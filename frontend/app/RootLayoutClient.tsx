'use client';

import { useState, useCallback } from 'react';
import { ChatKitWidget } from '@/components/ChatKitWidget';
import { TextSelectionMenu } from '@/components/TextSelectionMenu';

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const [prePopulatedText, setPrePopulatedText] = useState<string | undefined>(undefined);

  const handleAskFromAI = useCallback((selectedText: string) => {
    setPrePopulatedText(selectedText);
  }, []);

  const handleClearPrePopulatedText = useCallback(() => {
    setPrePopulatedText(undefined);
  }, []);

  return (
    <>
      {children}
      <TextSelectionMenu onAskFromAI={handleAskFromAI} />
      <ChatKitWidget
        prePopulatedText={prePopulatedText}
        onClearPrePopulatedText={handleClearPrePopulatedText}
      />
    </>
  );
}
