import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, Activity } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          login(data.token, data.user);
        } else {
          alert("Registration successful! Please login.");
          setIsLogin(true);
        }
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      alert("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card login-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon">
            <Activity size={32} color="#8b5cf6" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: '#94a3b8' }}>
            {isLogin ? 'Enter your credentials to access the AI dashboard' : 'Join the most advanced CLV platform'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><User size={16} /> Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="admin"
              required 
            />
          </div>
          <div className="form-group">
            <label><Lock size={16} /> Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            className="btn-text" 
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#8b5cf6', fontWeight: 600 }}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
