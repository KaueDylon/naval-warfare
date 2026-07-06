import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => {
          api.clearToken();
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    api.setToken(data.tokenJWT);
    setToken(data.tokenJWT);
    const userData = await api.getMe();
    setUser(userData);
    return userData;
  }

  async function register(name, email, password) {
    const data = await api.register(name, email, password);
    api.setToken(data.tokenJWT);
    setToken(data.tokenJWT);
    const userData = await api.getMe();
    setUser(userData);
    return userData;
  }

  function logout() {
    api.clearToken();
    setToken(null);
    setUser(null);
  }

  function refreshUser() {
    return api.getMe().then(setUser);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
