import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './components/AdminDashboard';
import { LogOut, LayoutDashboard, Settings, User } from 'lucide-react';

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (!isAuthenticated) {
    return authView === 'login' 
      ? <Login onSwitch={() => setAuthView('register')} /> 
      : <Register onSwitch={() => setAuthView('login')} />;
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
            <p className="user-role">{user?.is_admin ? 'Administrator' : 'Analyst'}</p>
          </div>
        </div>

        <div className="nav-items">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={24} />
            <span>Dashboard</span>
          </button>
          
          {user?.is_admin && (
            <button 
              className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Settings size={24} />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
        
        <button className="nav-btn logout-btn" onClick={logout}>
          <LogOut size={24} />
          <span>Sign Out</span>
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' ? <Dashboard /> : <AdminDashboard />}
      </main>
    </div>
  );
};

export default App;
