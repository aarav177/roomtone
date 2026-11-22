import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin(await api.login(username));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <h1 className="wordmark">Roomtone</h1>
        <p className="login-lead">Pick a name to join the conversation.</p>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          autoFocus
          maxLength={20}
          aria-describedby="username-hint"
        />
        <p id="username-hint" className="hint">
          2-20 letters, numbers or underscores.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy || username.trim().length < 2}>
          {busy ? 'Joining...' : 'Join chat'}
        </button>
      </form>
    </main>
  );
}
