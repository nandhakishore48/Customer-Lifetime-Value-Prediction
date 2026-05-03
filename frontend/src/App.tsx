import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { 
  LogOut, LayoutDashboard, User, BarChart3, 
  ShieldCheck, Zap, Globe, Github, Twitter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LandingPage: React.FC<{ onAuth: () => void }> = ({ onAuth }) => (
  <div className="landing-page">
    <nav className="landing-nav">
      <div className="nav-logo">
        <div className="logo-pulse"></div>
        LTV AI Pro
      </div>
      <button className="btn btn-primary" onClick={onAuth}>Get Started</button>
    </nav>

    <header className="hero-section">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-content"
      >
        <span className="badge-new">Version 2.0 is live 🚀</span>
        <h1>Predict Customer Value with <span className="text-gradient">Enterprise AI</span></h1>
        <p>Unlock deep insights into your customer base using XGBoost, LightGBM, and SHAP explainability. Scale your marketing with data-driven precision.</p>
        <div className="hero-btns">
          <button className="btn btn-primary btn-lg" onClick={onAuth}>Launch Dashboard</button>
          <button className="btn btn-outline btn-lg">Documentation</button>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="hero-image"
      >
        <div className="glass-card dashboard-preview">
          <div className="preview-header">
            <div className="dot red"></div><div className="dot yellow"></div><div className="dot green"></div>
          </div>
          <div className="preview-body">
            <div className="preview-line long"></div>
            <div className="preview-grid">
              <div className="preview-item"></div>
              <div className="preview-item"></div>
              <div className="preview-item"></div>
            </div>
            <div className="preview-chart"></div>
          </div>
        </div>
      </motion.div>
    </header>

    <section className="features-grid">
      <FeatureCard 
        icon={<Zap size={32} color="#8b5cf6" />} 
        title="Predictive Regression" 
        desc="Don't just segment. Predict actual dollar value of every customer with LightGBM."
      />
      <FeatureCard 
        icon={<ShieldCheck size={32} color="#10b981" />} 
        title="SHAP Explainability" 
        desc="Understand exactly why the AI classified a customer. No more black-box models."
      />
      <FeatureCard 
        icon={<Globe size={32} color="#ec4899" />} 
        title="Enterprise Scalability" 
        desc="Built with PostgreSQL and Docker. Ready for millions of transactions."
      />
    </section>

    <footer className="landing-footer">
      <div className="footer-content">
        <div className="footer-logo">LTV AI</div>
        <div className="footer-links">
          <Github size={20} />
          <Twitter size={20} />
        </div>
        <p>© 2026 LTV AI SaaS Platform. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

const FeatureCard = ({ icon, title, desc }: any) => (
  <motion.div whileHover={{ y: -5 }} className="glass-card feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </motion.div>
);

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (!isAuthenticated && !showAuth) {
    return <LandingPage onAuth={() => setShowAuth(true)} />;
  }

  if (!isAuthenticated && showAuth) {
    return (
      <div className="auth-overlay">
        <button className="back-btn" onClick={() => setShowAuth(false)}>← Back</button>
        {authView === 'login' 
          ? <Login onSwitch={() => setAuthView('register')} /> 
          : <Register onSwitch={() => setAuthView('login')} />}
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <nav className="side-nav">
        <div className="nav-logo">
          <div className="logo-pulse"></div>
          LTV AI
        </div>
        
        <div className="user-brief">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <p className="user-email">{user?.email.split('@')[0]}</p>
            <p className="user-role">Premium Plan</p>
          </div>
        </div>

        <div className="nav-items">
          <button className="nav-btn active">
            <LayoutDashboard size={24} />
            <span>Dashboard</span>
          </button>
          <button className="nav-btn">
            <BarChart3 size={24} />
            <span>Advanced Stats</span>
          </button>
        </div>
        
        <button className="nav-btn logout-btn" onClick={logout}>
          <LogOut size={24} />
          <span>Sign Out</span>
        </button>
      </nav>

      <main className="main-content">
        <Dashboard />
      </main>
    </div>
  );
};

export default App;
