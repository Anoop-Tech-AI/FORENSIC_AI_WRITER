import React from 'react';

const DebugFallback = () => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#05070d',
      color: 'white',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#3b82f6', marginBottom: '1rem' }}>App Loading</h1>
      <p style={{ marginBottom: '2rem' }}>If you see this, the basic React app is working.</p>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #374151',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto'
      }} />
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
        Check browser console for errors...
      </p>
    </div>
  );
};

export default DebugFallback;
