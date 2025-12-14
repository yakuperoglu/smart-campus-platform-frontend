import React, { useEffect } from 'react';

const FeedbackMessage = ({ type, message, onClose }) => {
    useEffect(() => {
        if (type !== 'loading' && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto close after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [type, message, onClose]);

    if (!message) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#d4edda';
            case 'error': return '#f8d7da';
            case 'loading': return '#e2e3e5';
            default: return '#fff';
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success': return '#155724';
            case 'error': return '#721c24';
            case 'loading': return '#383d41';
            default: return '#000';
        }
    };

    const style = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '5px',
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '300px',
        transition: 'all 0.3s ease'
    };

    return (
        <div style={style}>
            <div style={{ flex: 1 }}>
                {type === 'loading' && <span style={{ marginRight: '10px' }}>⏳</span>}
                {type === 'success' && <span style={{ marginRight: '10px' }}>✅</span>}
                {type === 'error' && <span style={{ marginRight: '10px' }}>⚠️</span>}
                {message}
            </div>
            {type !== 'loading' && (
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: 'inherit',
                        opacity: 0.7
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default FeedbackMessage;
