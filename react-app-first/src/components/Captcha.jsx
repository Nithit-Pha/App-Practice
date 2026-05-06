import React, { useState, useEffect } from 'react';

const SimpleCaptcha = ({ onVerify }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  // Function to generate a random string for CAPTCHA
  const generateCaptcha = () => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setError('');
    setVerified(false);
    if (onVerify) onVerify(false); // notify parent that previous verification is invalidated
  };

  useEffect(() => {
    generateCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = () => {
    if (userInput === captchaText) {
      setVerified(true);
      setError('');
      if (onVerify) onVerify(true);
    } else {
      setVerified(false);
      setError('Incorrect CAPTCHA, please try again.');
      if (onVerify) onVerify(false);
      generateCaptcha();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.captchaBox}>
        <span style={styles.code}>{captchaText}</span>
        <button type="button" onClick={generateCaptcha} style={styles.refreshBtn}>
          🔄
        </button>
      </div>

      <input
        type="text"
        placeholder="Enter the code"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        disabled={verified}
        style={styles.input}
      />
      <button
        type="button"
        onClick={handleVerify}
        disabled={verified}
        style={verified ? { ...styles.submitBtn, ...styles.verifiedBtn } : styles.submitBtn}
      >
        {verified ? '✓ Verified' : 'Verify'}
      </button>

      {error && <p style={{ color: 'red', fontSize: '12px', margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
};

const styles = {
  container: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', boxSizing: 'border-box' },
  captchaBox: {
    background: '#f0f0f0',
    padding: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%)',
    marginBottom: '10px'
  },
  code: { letterSpacing: '5px', fontWeight: 'bold', fontStyle: 'italic', fontSize: '20px', userSelect: 'none' },
  refreshBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' },
  input: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  verifiedBtn: { backgroundColor: '#28a745', cursor: 'default' }
};

export default SimpleCaptcha;
