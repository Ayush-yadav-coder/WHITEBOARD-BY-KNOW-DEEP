import React from 'react';

interface AiLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const AiLogo: React.FC<AiLogoProps> = ({
  className = '',
  size = 56,
  animate = true,
}) => {
  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src="/ai-logo.svg"
        alt="Know Deep AI Ring Logo"
        className={`w-full h-full object-contain rounded-2xl drop-shadow-[0_0_12px_rgba(6,182,212,0.6)] ${
          animate ? 'transition-transform duration-300 hover:scale-105 active:scale-95' : ''
        }`}
      />
    </div>
  );
};
