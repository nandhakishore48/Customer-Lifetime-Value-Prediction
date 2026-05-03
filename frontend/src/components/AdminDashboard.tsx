import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Server, Database, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container animate-fade-in">
      <header style={{ marginBottom: '3rem' }}>
        <h1>Admin Control Panel</h1>
        <p className="subtitle">System health, user management and global analytics</p>
      </header>

      <div className="stats-grid">
        <AdminCard icon={<Users size={24} color="#8b5cf6" />} title="Total Users" value="124" />
        <AdminCard icon={<Server size={24} color="#10b981" />} title="System Load" value="12%" />
        <AdminCard icon={<Database size={24} color="#f59e0b" />} title="DB Records" value="45.2k" />
        <AdminCard icon={<Shield size={24} color="#ef4444" />} title="Security Events" value="0" />
      </div>

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="#8b5cf6" /> System Activity
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>admin</td>
                <td>Model Re-trained</td>
                <td>2 mins ago</td>
                <td><span className="badge badge-high">Success</span></td>
              </tr>
              <tr>
                <td>system</td>
                <td>Auto Backup</td>
                <td>1 hour ago</td>
                <td><span className="badge badge-medium">Pending</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminCard = ({ icon, title, value }: any) => (
  <div className="glass-card">
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
        {icon}
      </div>
      <div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{title}</p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</h2>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
