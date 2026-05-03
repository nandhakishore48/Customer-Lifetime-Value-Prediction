import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onSwitch: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => onSwitch(), 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection to server failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card login-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Account Created!</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card login-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="logo-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <UserPlus size={32} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '1rem', letterSpacing: '-0.02em' }}>
            Get Started
          </h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            Join the elite circle of data-driven marketers
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
            <label><Lock size={16} /> Create Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Min. 6 characters"
              required 
            />
          </div>
          <div className="form-group">
            <label><Lock size={16} /> Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="Repeat password"
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', background: '#10b981' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <button 
              className="btn-text" 
              onClick={onSwitch}
              style={{ color: '#10b981', fontWeight: 700, cursor: 'pointer' }}
            >
              Sign In Instead
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
