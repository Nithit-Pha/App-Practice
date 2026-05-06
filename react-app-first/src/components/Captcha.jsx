import React, { useEffect, useState } from 'react';

// Server-issued CAPTCHA. The component fetches a challenge {id, text} from
// the API and reports the user's typed answer back to the parent via
// `onChange({ id, answer })`. Verification happens on the server when the
// auth form is submitted — never trust a client-side captcha check.
const SimpleCaptcha = ({ onChange }) => {
  const [captchaId, setCaptchaId] = useState(null);
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = async () => {
    setLoading(true);
    setError('');
    setUserInput('');
    if (onChange) onChange({ id: null, answer: '' });
    try {
      const res = await fetch('http://localhost:5000/api/captcha');
      if (!res.ok) throw new Error('Bad response');
      const data = await res.json();
      setCaptchaId(data.id);
      setCaptchaText(data.text);
      if (onChange) onChange({ id: data.id, answer: '' });
    } catch (e) {
      setCaptchaId(null);
      setCaptchaText('');
      setError('Could not load captcha. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    if (onChange) onChange({ id: captchaId, answer: value });
  };

  return (
    <div style={styles.container}>
      <div style={styles.captchaBox}>
        <span style={styles.code}>{loading ? '...' : captchaText}</span>
        <button
          type="button"
          onClick={fetchCaptcha}
          style={styles.refreshBtn}
          title="Get a new captcha"
        >
          🔄
        </button>
      </div>

      <input
        type="text"
        placeholder="Enter the code above"
        value={userInput}
        onChange={handleInputChange}
        style={styles.input}
        autoComplete="off"
      />

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
  input: { width: '100%', padding: '8px', boxSizing: 'border-box' },
};

export default SimpleCaptcha;
