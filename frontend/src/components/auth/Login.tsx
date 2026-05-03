import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Activity, AlertCircle } from 'lucide-react';

interface LoginProps {
  onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection to server failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card login-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="logo-icon">
            <Activity size={32} color="#8b5cf6" />
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '1rem', letterSpacing: '-0.02em' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            Access your AI-powered customer insights
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="error-banner"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><Mail size={16} /> Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="name@company.com"
              required 
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label><Lock size={16} /> Password</label>
              <a href="#" style={{ fontSize: '0.8rem', color: '#8b5cf6', textDecoration: 'none' }}>Forgot?</a>
            </div>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            New to the platform?{' '}
            <button 
              className="btn-text" 
              onClick={onSwitch}
              style={{ color: '#8b5cf6', fontWeight: 700, cursor: 'pointer' }}
            >
              Create an Account
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
