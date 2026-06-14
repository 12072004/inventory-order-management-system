import React from 'react'

export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}
