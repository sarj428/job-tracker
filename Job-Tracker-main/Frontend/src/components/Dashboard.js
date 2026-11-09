import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getJobStats } from '../services/jobService';
import { STATUS_COLORS } from '../utils/constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statCards = [
  { key: 'total',        label: 'Total Applications', icon: '📋', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { key: 'thisMonth',    label: 'This Month',          icon: '📅', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'Interview',    label: 'Interviews',          icon: '🎙', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'Offer',        label: 'Offers',              icon: '🎉', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'Rejected',     label: 'Rejected',            icon: '✕',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  { key: 'offerRate',    label: 'Offer Rate',          icon: '%',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', suffix: '%' },
];

const pipelineStatuses = ['Saved', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getJobStats();
        setStats(res.stats);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const getStatValue = (card) => {
    if (card.key === 'total') return stats.total;
    if (card.key === 'thisMonth') return stats.thisMonth;
    if (card.key === 'offerRate') return stats.offerRate;
    return stats.byStatus[card.key] ?? 0;
  };

  // Build monthly chart data
  const monthlyChartData = (stats.monthly || []).map((m) => ({
    name: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    count: m.count,
  }));

  return (
    <div>
      {/* Stat cards */}
      <div className="dashboard-grid">
        {statCards.map((card) => (
          <div className="stat-card" key={card.key}>
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-value">
              {getStatValue(card)}{card.suffix || ''}
            </div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-row">
        {/* Pipeline breakdown */}
        <div className="card-surface">
          <div className="section-title">Pipeline Breakdown</div>
          <div className="pipeline-list">
            {pipelineStatuses.map((status) => {
              const count = stats.byStatus[status] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div className="pipeline-item" key={status}>
                  <div className="pipeline-item-header">
                    <span className="pipeline-label">{status}</span>
                    <span className="pipeline-count">{count}</span>
                  </div>
                  <div className="pipeline-bar-track">
                    <div
                      className="pipeline-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: STATUS_COLORS[status] || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applications per month chart */}
        <div className="card-surface">
          <div className="section-title">Applications Over Time</div>
          {monthlyChartData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">📈</div>
              <div className="empty-desc">No data yet. Start adding applications!</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1d27',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8,
                    color: '#f0f2ff',
                    fontSize: 13,
                  }}
                  cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#6366f1" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Upcoming interviews */}
      <div className="card-surface">
        <div className="section-title">Upcoming Interviews (next 30 days)</div>
        {!stats.upcomingInterviews || stats.upcomingInterviews.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">🎙</div>
            <div className="empty-desc">No interviews scheduled in the next 30 days.</div>
          </div>
        ) : (
          <div className="interview-list">
            {stats.upcomingInterviews.map((iv) => {
              const d = iv.interview?.date ? new Date(iv.interview.date) : null;
              return (
                <div className="interview-item" key={iv._id}>
                  {d ? (
                    <div className="interview-date-badge">
                      <div className="interview-date-day">{d.getDate()}</div>
                      <div className="interview-date-mon">{MONTHS[d.getMonth()]}</div>
                    </div>
                  ) : (
                    <div className="interview-date-badge">
                      <div className="interview-date-day">?</div>
                    </div>
                  )}
                  <div className="interview-info">
                    <div className="interview-company">{iv.companyName}</div>
                    <div className="interview-role">{iv.jobTitle}</div>
                    <div className="interview-type">{iv.interview?.type || ''}</div>
                  </div>
                  {iv.interview?.time && (
                    <div className="interview-time">{iv.interview.time}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
