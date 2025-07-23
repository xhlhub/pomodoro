import React, { useState, useEffect } from 'react';
import './ProgressModal.css';
import { ProgressModalProps } from '../types';

const ProgressModal: React.FC<ProgressModalProps> = ({ task, onClose, onUpdateProgress }) => {
  const [selectedProgress, setSelectedProgress] = useState<number>(0);
  const [customProgress, setCustomProgress] = useState<number>(0);

  useEffect(() => {
    if (task) {
      setSelectedProgress(task.progress);
      setCustomProgress(task.progress);
    }
  }, [task]);

  const handleProgressButtonClick = (progress: number): void => {
    setSelectedProgress(progress);
    setCustomProgress(progress);
  };

  const handleCustomProgressChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value);
    setCustomProgress(value);
    setSelectedProgress(value);
  };

  const handleSave = (): void => {
    onUpdateProgress(task.id, selectedProgress);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!task) return null;

  return (
    <div className="modal" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fas fa-hand-pointer"></i> 更新任务进度</h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div className="modal-body">
          <p>任务：<span>{task.name}</span></p>
          
          <div className="progress-options">
            <button 
              className={`progress-btn ${selectedProgress === 20 ? 'active' : ''}`}
              onClick={() => handleProgressButtonClick(20)}
            >
              <i className="fas fa-arrow-up"></i> 20%
            </button>
            <button 
              className={`progress-btn ${selectedProgress === 50 ? 'active' : ''}`}
              onClick={() => handleProgressButtonClick(50)}
            >
              <i className="fas fa-arrow-up"></i> 50%
            </button>
            <button 
              className={`progress-btn ${selectedProgress === 100 ? 'active' : ''}`}
              onClick={() => handleProgressButtonClick(100)}
            >
              <i className="fas fa-check"></i> 100%
            </button>
          </div>
          
          <div className="custom-progress">
            <label htmlFor="customProgressRange">
              <i className="fas fa-sliders-h"></i> 自定义进度：
            </label>
            <input
              id="customProgressRange"
              type="range"
              min="0"
              max="100"
              value={customProgress}
              onChange={handleCustomProgressChange}
            />
            <span className="custom-progress-value">{customProgress}%</span>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fas fa-save"></i> 保存进度
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i> 取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal; 