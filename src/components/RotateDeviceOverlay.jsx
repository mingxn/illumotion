import React from 'react';

export default function RotateDeviceOverlay() {
  return (
    <div className="rotate-device-overlay">
      <div className="rotate-device-content">
        <div className="phone-icon-container">
          <svg className="phone-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        </div>
        <h2>Rotate Your Phone</h2>
        <p>This experience is best viewed in landscape mode.</p>
      </div>
    </div>
  );
}
