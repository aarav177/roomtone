import { useState } from 'react';
import Login from './components/Login.jsx';
import Chat from './components/Chat.jsx';

const STORAGE_KEY = 'roomtone:user';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(readStoredUser);

  const handleLogin = (nextUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return user ? <Chat user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />;
}
