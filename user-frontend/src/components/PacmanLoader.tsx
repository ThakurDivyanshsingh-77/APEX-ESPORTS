'use client';

import React from 'react';

interface PacmanLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export default function PacmanLoader({ text = 'LOADING...', fullScreen = false }: PacmanLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      <div className="loader-wrapper">
        <div className="packman" />
        <div className="dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
      {text && (
        <span className="text-xs font-bold uppercase tracking-widest text-[#DFE104] mt-2 animate-pulse font-mono">
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-[#FAFAFA]">
        {content}
      </div>
    );
  }

  return content;
}
