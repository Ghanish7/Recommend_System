import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, Info, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import MetricsTable from '../components/MetricsTable';

export default function Evaluation() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const fetchMetrics = () => {
    setLoading(true);
    setError(null);
    fetch('http://127.0.0.1:8000/evaluate')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load evaluation metrics");
        return res.json();
      })
      .then(data => {
        setMetrics(data.metrics);
        setStatus(data.status);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Error loading metrics. Please ensure the backend is running.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const chartData = metrics.map(m => ({
    name: m.algorithm,
    Precision: m.precision,
    Recall: m.recall,
    'F1-Score': m.f1_score,
  }));

  const rmseData = metrics.map(m => ({
    name: m.algorithm,
    RMSE: m.rmse
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-accentBlue/30 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="font-bold text-white mb-1.5 text-xs sm:text-sm">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="text-xs font-semibold" style={{ color: p.color }}>
              {p.name}: {p.value.toFixed(2)}{p.name !== 'RMSE' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12"
    >
      
      {/* Header and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-3">
            <BarChart2 className="w-8 h-8 text-accentBlue" />
            <span className="text-accentBlue">Evaluation Dashboard</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 font-light">
            Evaluating systems using 80/20 train/test split on MovieLens ratings.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center space-x-2 bg-black border border-gray-800 hover:border-accentBlue/40 disabled:opacity-50 text-xs font-bold text-gray-300 px-4 py-2.5 rounded-xl transition-all self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Recalculating...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {loading && metrics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-accentBlue animate-spin" />
          <p className="text-gray-400 text-sm">Evaluating predictions and testing model recommendations...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-800/40 p-6 rounded-2xl text-red-400 text-center max-w-lg mx-auto">
          {error}
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Status Indicator */}
          {status === 'calculating' && (
            <div className="bg-black border border-accentBlue/20 p-4 rounded-xl flex items-start space-x-3 text-accentBlue text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Evaluation calculation is in progress in the background...</p>
                <p className="text-xs text-gray-400 mt-0.5">We are currently using cached baseline values. Click "Refresh Metrics" in a few seconds once processing completes.</p>
              </div>
            </div>
          )}

          {/* Metrics Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Performance Metrics</span>
            </h3>
            <MetricsTable metrics={metrics} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Precision, Recall, F1 */}
            <div className="bg-darkCard/20 border border-gray-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Recommendation Quality Comparison</h4>
              <div className="h-[300px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 15 }} />
                    <Bar dataKey="Precision" fill="rgba(59, 130, 246, 0.4)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Recall" fill="rgba(59, 130, 246, 0.7)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="F1-Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: RMSE */}
            <div className="bg-darkCard/20 border border-gray-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Rating Prediction Error (RMSE)</h4>
              <div className="h-[300px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rmseData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} domain={[0, 1.2]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 15 }} />
                    <Bar dataKey="RMSE" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Metrics Explanation Section */}
          <div className="bg-darkCard/10 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Info className="w-5 h-5 text-accentBlue" />
              <span>Understanding the Metrics</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-bold text-accentBlue/80">Precision@10</h4>
                <p className="text-gray-400 leading-relaxed font-light">
                  Measures what fraction of the top-10 recommended movies are actually "relevant" (rated 3.5 or higher by the user in the test split). Higher precision translates to more relevant suggestions on first glance.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-accentBlue/80">Recall@10</h4>
                <p className="text-gray-400 leading-relaxed font-light">
                  Measures what fraction of the user's highly-rated test movies were successfully captured within our top-10 recommendations. High recall indicates the system is capturing a broad range of user preferences.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-accentBlue">F1-Score</h4>
                <p className="text-gray-400 leading-relaxed font-light">
                  The harmonic mean of Precision and Recall. F1-Score provides a single unified metric of recommendation quality, showing how well the system balances precision and coverage.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-secondaryCyan">RMSE (Root Mean Squared Error)</h4>
                <p className="text-gray-400 leading-relaxed font-light">
                  Computes the average deviation between predicted ratings and the user's actual ratings in the test set. A lower RMSE indicates the recommender is extremely accurate at predicting specific rating scores.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}
