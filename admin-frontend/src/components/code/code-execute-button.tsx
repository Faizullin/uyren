"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Loader2 } from 'lucide-react';
import { CodeRunner } from './code-runner';

interface CodeExecuteButtonProps {
  code: string;
  language: string;
  className?: string;
  size?: 'sm' | 'lg' | 'default' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
}

export const CodeExecuteButton: React.FC<CodeExecuteButtonProps> = ({
  code,
  language,
  className = '',
  size = 'sm',
  variant = 'outline'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleRun = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center gap-2 ${className}`}
          onClick={handleRun}
        >
          <Play className="w-4 h-4" />
          Run
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Code Execution</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto">
          <CodeRunner
            initialCode={code}
            initialLanguage={language}
            className="border-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeExecuteButton;
