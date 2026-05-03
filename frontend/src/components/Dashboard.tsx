import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';
import { 
  Users, TrendingUp, Clock, DollarSign, Activity, 
  Upload, Play, Target, ChevronRight, AlertCircle, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SEGMENT_COLORS = {
  High: '#10b981',
  Medium: '#f59e0b',
  Low: '#ef4444'
};

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [predictionInput, setPredictionInput] = useState({ recency: '', frequency: '', monetary: '' });
  const [predictionResult, setPredictionResult] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    checkConnection();
    fetchStats();
  }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch (err) {
      setBackendStatus('offline');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleGenerateData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate-data`, { 
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      setCustomers(data.data);
      setAccuracy(data.accuracy);
      fetchStats();
    } catch (err) {
      alert("Analysis failed. Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/process-csv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // No Content-Type for FormData
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.data);
        setAccuracy(data.accuracy);
        fetchStats();
        alert(`Successfully processed ${data.customer_count} customers!`);
      } else {
        alert(data.error || "File processing failed");
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(predictionInput)
      });
      const data = await res.json();
      setPredictionResult(data.segment);
    } catch (err) {
      alert("Prediction failed");
    }
  };

  const pieData = stats?.segments ? Object.keys(stats.segments).map(key => ({
    name: key,
    value: stats.segments[key]
  })) : [];

  const scatterData = customers.map(c => ({
    x: c.Frequency,
    y: c.Monetary,
    name: c.CustomerID,
    segment: c.Segment
  }));

  return (
    <div className="container animate-fade-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1>Dashboard</h1>
            <span className={`status-badge ${backendStatus}`}>
              <span className="pulse"></span>
              Backend {backendStatus}
            </span>
          </div>
          <p className="subtitle">Real-time Customer Lifetime Value Insights</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleGenerateData} disabled={loading}>
            {loading ? <Activity className="animate-spin" /> : <Play size={20} />}
            Run Demo
          </button>
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload size={20} />
            Upload CSV
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept=".csv" 
            onChange={handleFileUpload} 
          />
        </div>
      </header>

      {/* KPI Section */}
      <div className="stats-grid">
        <StatCard icon={<Users size={24} color="#8b5cf6" />} title="Total Customers" value={stats?.total_customers || '--'} />
        <StatCard icon={<Clock size={24} color="#ef4444" />} title="Avg. Recency" value={stats?.avg_recency?.toFixed(1) || '--'} suffix=" days" />
        <StatCard icon={<TrendingUp size={24} color="#10b981" />} title="Avg. Frequency" value={stats?.avg_frequency?.toFixed(1) || '--'} suffix=" orders" />
        <StatCard icon={<DollarSign size={24} color="#f59e0b" />} title="Avg. Monetary" value={stats ? `$${stats.avg_monetary.toFixed(0)}` : '--'} />
      </div>

      <div className="charts-grid">
        <div className="glass-card">
          <h3 className="card-title"><Target size={20} /> Segment Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.name as keyof typeof SEGMENT_COLORS]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', borderRadius: '12px', border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="card-title"><Activity size={20} /> Customer Value Scatter</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" name="Frequency" stroke="#94a3b8" />
                <YAxis type="number" dataKey="y" name="Monetary" stroke="#94a3b8" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.segment as keyof typeof SEGMENT_COLORS]} opacity={0.6} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="glass-card">
          <h3>Individual Prediction</h3>
          <form onSubmit={handlePredict} style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Recency</label>
              <input type="number" value={predictionInput.recency} onChange={e => setPredictionInput({...predictionInput, recency: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Frequency</label>
              <input type="number" value={predictionInput.frequency} onChange={e => setPredictionInput({...predictionInput, frequency: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Monetary</label>
              <input type="number" value={predictionInput.monetary} onChange={e => setPredictionInput({...predictionInput, monetary: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Predict</button>
          </form>

          {predictionResult && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="prediction-result"
              style={{ background: `rgba(${predictionResult === 'High' ? '16, 185, 129' : predictionResult === 'Medium' ? '245, 158, 11' : '239, 68, 68'}, 0.1)`, 
              border: `1px solid ${SEGMENT_COLORS[predictionResult as keyof typeof SEGMENT_COLORS]}` }}>
              <p>Predicted Class:</p>
              <h2 style={{ color: SEGMENT_COLORS[predictionResult as keyof typeof SEGMENT_COLORS] }}>{predictionResult} Value</h2>
            </motion.div>
          )}
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Customer Intelligence Table</h3>
            {accuracy && <div className="accuracy-badge">Accuracy: {(accuracy * 100).toFixed(1)}%</div>}
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Recency</th>
                  <th>Frequency</th>
                  <th>Monetary</th>
                  <th>Segment</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? customers.slice(0, 10).map((c, i) => (
                  <tr key={i}>
                    <td>{c.CustomerID}</td>
                    <td>{c.Recency}d</td>
                    <td>{c.Frequency}</td>
                    <td>${c.Monetary.toFixed(0)}</td>
                    <td><span className={`badge badge-${c.Segment.toLowerCase()}`}>{c.Segment}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No data loaded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, suffix = '' }: any) => (
  <div className="glass-card">
    <div className="stat-icon-wrapper">{icon}</div>
    <p className="stat-label">{title}</p>
    <h2 className="stat-value">{value}{suffix}</h2>
  </div>
);

export default Dashboard;
