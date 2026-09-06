import React from 'react';

interface WhiteboardLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const WhiteboardLogo: React.FC<WhiteboardLogoProps> = ({
  className = '',
  size = 40,
  animate = true,
}) => {
  return (
    <div
      id="whiteboard-note-app-logo"
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src="/whiteboard-note-logo.svg"
        alt="Whiteboard Note Logo"
        className={`w-full h-full object-contain rounded-xl drop-shadow-md ${
          animate ? 'transition-transform duration-300 hover:scale-105 active:scale-95' : ''
        }`}
      />
    </div>
  );
};
