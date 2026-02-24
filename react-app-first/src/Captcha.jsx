import React, { useState, useEffect } from 'react';

const SimpleCaptcha = ({ onVerify }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');

  // Function to generate a random string for CAPTCHA
  const generateCaptcha = () => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result); // Update CAPTCHA text
    setUserInput(''); // Reset input
    setError(''); // Clear error message on new CAPTCHA generation
  };

  useEffect(() => { // Generate CAPTCHA on component mount
    generateCaptcha();
  }, []);

  const handleSubmit = (e) => { // Handle form submission
    e.preventDefault();  //
    if (userInput === captchaText) {
      onVerify(true);
      alert("Verification Successful!");
    } else {
      setError("Incorrect CAPTCHA, please try again.");
      generateCaptcha(); // Refresh on failure
    }
  };

  // Render the CAPTCHA component
  return (
    <div style={styles.container}>
      <div style={styles.captchaBox}>
        <span style={styles.code}>{captchaText}</span>
        <button type="button" onClick={generateCaptcha} style={styles.refreshBtn}>
          🔄
        </button>
      </div>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Enter the code"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.submitBtn}>Verify</button>
      </form>
      
      {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
    </div>
  );
};

// Captcha styles
const styles = {
  container: { padding: '20px', border: '1px solid #ddd', borderRadius: '8px', width: '250px' },
  captchaBox: { 
    background: '#f0f0f0', 
    padding: '10px', 
    display: 'flex', 
    justifyContent: 'space-between',
    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%)', // Basic "noise" background
    marginBottom: '10px'
  },
  code: { letterSpacing: '5px', fontWeight: 'bold', fontStyle: 'italic', fontSize: '20px', userSelect: 'none' },
  refreshBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  input: { width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default SimpleCaptcha;