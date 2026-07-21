import React from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="lumina-modal-overlay">
      <div className="lumina-modal">
        <div className="lumina-modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="lumina-modal-close">&times;</button>
        </div>
        <div className="lumina-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
