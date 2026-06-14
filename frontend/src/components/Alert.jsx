import React from 'react'

export default function Alert({ type = 'success', message, onClose }) {
  if (!message) return null

  return (
    <div className={`alert alert-${type}`}>
      {message}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            float: 'right',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: 'inherit',
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  )
}
