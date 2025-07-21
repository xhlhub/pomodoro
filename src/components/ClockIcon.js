import React from 'react';
import './ClockIcon.css';

function ClockIcon({ size = 20, color = 'white' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="clock-icon"
    >
      {/* 时钟外圈 */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={color} 
        strokeWidth="2" 
        fill="transparent"
      />
      
      {/* 时钟刻度 */}
      {/* <g stroke={color} strokeWidth="1">
        <line x1="12" y1="3" x2="12" y2="5" strokeWidth="2"/>
        <line x1="21" y1="12" x2="19" y2="12" strokeWidth="2"/>
        <line x1="12" y1="21" x2="12" y2="19" strokeWidth="2"/>
        <line x1="3" y1="12" x2="5" y2="12" strokeWidth="2"/>
        
        <line x1="18.4" y1="5.6" x2="17.7" y2="6.3"/>
        <line x1="18.4" y1="18.4" x2="17.7" y2="17.7"/>
        <line x1="5.6" y1="5.6" x2="6.3" y2="6.3"/>
        <line x1="5.6" y1="18.4" x2="6.3" y2="17.7"/>
      </g> */}
      
      {/* 时针 - 指向2点钟方向 */}
      <line 
        x1="12" 
        y1="12" 
        x2="12" 
        y2="8" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      
      {/* 分针 - 带旋转动画 */}
      <line 
        x1="12" 
        y1="12" 
        x2="12" 
        y2="6" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round"
        className="minute-hand"
      />
      
      {/* 中心点 */}
      <circle 
        cx="12" 
        cy="12" 
        r="1.5" 
        fill={color}
      />
    </svg>
  );
}

export default ClockIcon; 