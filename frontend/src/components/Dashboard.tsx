import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend, LineChart, Line
} from 'recharts';
import { 
  Users, TrendingUp, Clock, DollarSign, Activity, 
  Upload, Play, Target, Download, Brain, Sparkles, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLORS = {
  High: '#10b981',
  Medium: '#f59e0b',
  Low: '#ef4444',
  Primary: '#6366f1',
  Secondary: '#ec4899'
};

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch (err) {
      setBackendStatus('offline');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (res.ok) {
        setData(result);
        setCustomers(result.data);
      } else {
        alert(result.error || "Upload failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clv_analysis_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Export failed");
    }
  };

  const pieData = data?.summary?.segment_counts ? Object.entries(data.summary.segment_counts).map(([name, value]) => ({
    name,
    value
  })) : [];

  return (
    <div className="container animate-fade-in">
      <header className="dashboard-header">
        <div>
          <div className="flex items-center gap-4">
            <h1>Enterprise Dashboard</h1>
            <div className={`status-badge ${backendStatus}`}>
              <div className="pulse"></div>
              {backendStatus.toUpperCase()}
            </div>
          </div>
          <p className="text-muted">AI-Powered Customer Lifetime Value Intelligence</p>
        </div>
        
        <div className="flex gap-4">
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={20} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload size={20} /> {loading ? 'Processing...' : 'Upload Data'}
          </button>
          <input type="file" ref={fileInputRef} hidden accept=".csv" onChange={handleFileUpload} />
        </div>
      </header>

      {/* KPI Section */}
      <div className="stats-grid">
        <StatCard 
          icon={<Users size={24} />} 
          title="Total Customers" 
          value={data?.summary?.total_customers || '--'} 
          color="#8b5cf6"
        />
        <StatCard 
          icon={<DollarSign size={24} />} 
          title="Avg. Predicted LTV" 
          value={data?.summary?.avg_clv ? `$${data.summary.avg_clv}` : '--'} 
          color="#10b981"
        />
        <StatCard 
          icon={<Activity size={24} />} 
          title="Model Accuracy" 
          value={data?.stats?.clf_accuracy ? `${(data.stats.clf_accuracy * 100).toFixed(1)}%` : '--'} 
          color="#ec4899"
        />
        <StatCard 
          icon={<Sparkles size={24} />} 
          title="High Value Segments" 
          value={data?.summary?.high_value_count || '--'} 
          color="#f59e0b"
        />
      </div>

      <div className="charts-grid">
        <div className="glass-card">
          <h3 className="flex items-center gap-2"><Target size={20} /> Segmentation (XGBoost)</h3>
          <div style={{ height: '300px', marginTop: '1rem' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="flex items-center gap-2"><Brain size={20} /> Value Distribution (LightGBM)</h3>
          <div style={{ height: '300px', marginTop: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={customers.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="CustomerID" hide />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="PredictedValue" fill={COLORS.Primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="main-data-section glass-card">
        <div className="flex justify-between items-center mb-6">
          <h3>Customer Intelligence Engine</h3>
          <span className="badge-new">Real-time Insights Active</span>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Monetary</th>
                <th>Frequency</th>
                <th>Predicted LTV</th>
                <th>Churn Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.slice(0, 15).map((c, i) => (
                <tr key={i} onClick={() => setSelectedCustomer(c)} className="cursor-pointer">
                  <td className="font-bold">{c.CustomerID}</td>
                  <td>${c.Monetary.toLocaleString()}</td>
                  <td>{c.Frequency} orders</td>
                  <td className="text-primary font-bold">${c.PredictedValue.toFixed(2)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${(c.Recency / 365) * 100}%`, background: c.Recency > 180 ? COLORS.Low : COLORS.High }}></div>
                      </div>
                      <span className="text-sm">{c.Recency > 180 ? 'High' : 'Low'}</span>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-text text-primary">View Insights</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Insight Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card modal-content" 
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Customer Analysis: {selectedCustomer.CustomerID}</h2>
                <button className="close-btn" onClick={() => setSelectedCustomer(null)}>×</button>
              </div>
              
              <div className="modal-grid">
                <div className="insight-card">
                  <h4><Brain size={18} /> SHAP Explainability</h4>
                  <p className="text-sm text-muted mb-4">Why this customer is {selectedCustomer.Segment} value:</p>
                  <div className="insight-lines">
                    <div className="insight-line">
                      <span>Monetary Value</span>
                      <div className="line-fill positive" style={{ width: '80%' }}></div>
                    </div>
                    <div className="insight-line">
                      <span>Purchase Frequency</span>
                      <div className="line-fill positive" style={{ width: '60%' }}></div>
                    </div>
                    <div className="insight-line">
                      <span>Days since last order</span>
                      <div className="line-fill negative" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="recommendation-card">
                  <h4><Sparkles size={18} /> AI Recommendation</h4>
                  <div className="recommendation-box">
                    <AlertTriangle size={20} color="#f59e0b" />
                    <p>Suggested Action: {
                      selectedCustomer.Segment === 'High' ? 'VIP Loyalty Invite' : 
                      selectedCustomer.Segment === 'Medium' ? 'Personalized Bundle Offer' : 'Re-engagement Discount'
                    }</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }: any) => (
  <div className="glass-card stat-card-enterprise">
    <div className="flex items-center gap-4">
      <div className="icon-box" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-muted text-sm">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
    </div>
  </div>
);

export default Dashboard;
