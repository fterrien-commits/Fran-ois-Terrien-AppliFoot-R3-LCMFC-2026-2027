import React from 'react';

interface LcmfcLogoProps {
  className?: string;
  variant?: 'full' | 'crest' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  customLogoUrl?: string;
}

export const LcmfcLogo: React.FC<LcmfcLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
  customLogoUrl,
}) => {
  const logoSrc = customLogoUrl || '/logo-lcmfc.svg';

  const sizeClasses = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  };

  if (variant === 'crest') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200 overflow-hidden shrink-0 ${sizeClasses[size]} w-${sizeClasses[size].replace('h-', '')} ${className}`}
        style={{ aspectRatio: '1/1' }}
        title="Le Cellier - Mauves Football Club (LCMFC)"
      >
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full object-contain"
          aria-hidden="true"
        >
          {/* Concentric crescents of the official LCMFC emblem */}
          <radialGradient
            id="lcmfc_crest_grad"
            cx="139"
            cy="201"
            r="67"
            gradientTransform="matrix(1.33 0 0 1.33 -71 -163)"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#C8E7F5" />
            <stop offset="0.58" stopColor="#E30613" />
            <stop offset="1" stopColor="#BE1622" />
          </radialGradient>
          <path
            fill="url(#lcmfc_crest_grad)"
            d="M147.9,15.8c-49.4,0-89.4,40-89.4,89.4c0,49.4,40,89.4,89.4,89.4c17.6,0,34-5.1,47.9-13.9c-17.1,14.4-39.2,23.1-63.3,23.1c-54.3,0-98.3-44-98.3-98.3c0-54.3,44-98.3,98.3-98.3c22.9,0,43.9,7.8,60.7,20.9C179.9,20.3,164.4,15.8,147.9,15.8z"
          />
          <path
            fill="#831810"
            d="M69.4,19.5c-47.5,34-58.4,100.2-24.4,147.7c34,47.5,100.2,58.4,147.7,24.4c16.9-12.1,21.9-19,31.7-36.2c-3.1,8.4-17,39-40.2,55.6c-52.2,37.4-124.9,25.4-162.4-26.8C-15.6,131.9-3.6,59.2,48.6,21.8C70.6,6,96.3-1,121.4,0.1C103.2,1.7,85.3,8.1,69.4,19.5z"
          />
          <path
            fill="#E6332A"
            d="M202.1,51.4c-33.7-22.7-79.3-13.8-102,19.9c-22.7,33.7-13.8,79.3,19.9,102c12,8.1,25.5,12.2,39,12.5c-18.3,2-37.3-2.3-53.7-13.3C68.3,147.5,58.5,97.3,83.4,60.3c24.9-37,75.2-46.8,112.2-21.9c15.6,10.5,21.3,23.5,26,32.2C217.5,65.1,213.4,59,202.1,51.4z"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm ${className}`}>
        <img
          src={logoSrc}
          alt="Logo LCMFC"
          className={`${sizeClasses[size]} w-auto object-contain`}
          onError={(e) => {
            // fallback to inline svg if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="flex flex-col text-left leading-tight">
          <span className="text-xs font-extrabold text-slate-900 tracking-wide">
            LCMFC
          </span>
          <span className="text-[10px] font-bold text-red-600">
            Sénior R3
          </span>
        </div>
      </div>
    );
  }

  // Default: Full logo representation
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="Logo Le Cellier - Mauves Football Club"
        className={`${sizeClasses[size]} w-auto object-contain max-w-[180px] sm:max-w-[220px]`}
        onError={(e) => {
          // If external/static image fails, show graceful stylized fallback
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};
