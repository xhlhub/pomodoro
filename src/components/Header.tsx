import React from 'react';
import './Header.css';

interface HeaderProps {
  onShowHistory?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowHistory }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-text">
          <h1>🍅 Pomodoro for Her</h1>
          <p>专注工作，高效生活</p>
        </div>
        {onShowHistory && (
          <button className="history-button" onClick={onShowHistory} title="历史记录">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.05 11A9 9 0 1 1 3.05 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12H6L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>历史</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header; 