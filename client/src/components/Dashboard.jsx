import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients.js';
import { STAGES } from '../utils/stages.js';
import { getReminders } from '../utils/reminders.js';
import { differenceInDays, parseISO, isValid } from 'date-fns';

function MetricCard({ title, value, sub, color = 'var(--primary)', onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow)',
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.1s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function urgencyStyle(urgency) {
  if (urgency === 'urgent') return { bg: 'var(--danger-light)', color: 'var(--danger)', label: '紧急' };
  if (urgency === 'warning') return { bg: 'var(--warning-light)', color: 'var(--warning)', label: '提醒' };
  return { bg: 'var(--primary-light)', color: 'var(--primary)', label: '信息' };
}

export default function Dashboard() {
  const { clients, loading, error, fetchClients } = useClients();
  const navigate = useNavigate();

  useEffect(() => { fetchClients(); }, [fetchClients]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>加载中...</div>;
  if (error) return <div style={{ padding: 40, color: 'var(--danger)' }}>错误: {error}</div>;

  const reminders = getReminders(clients);

  // Stage counts
  const stageCounts = STAGES.map(s => ({
    ...s,
    count: clients.filter(c => c.stage === s.id).length
  }));

  // Needs follow-up (nextFollowUpDate >= 7 days ago or missing)
  const needsFollowUp = clients.filter(c => {
    if (!c.nextFollowUpDate) return false;
    const d = parseISO(String(c.nextFollowUpDate));
    if (!isValid(d)) return false;
    return differenceInDays(new Date(), d) >= 7;
  }).length;

  // Review due this month (83-90 days since join)
  const reviewDue = clients.filter(c => {
    if (!c.joinDate) return false;
    const d = parseISO(String(c.joinDate));
    if (!isValid(d)) return false;
    const days = differenceInDays(new Date(), d);
    return days >= 80 && days <= 90;
  }).length;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>数据总览</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 13 }}>汇泽甲功客户健康管理概览</p>
      </div>

      {/* Top metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <MetricCard
          title="当前总客户数"
          value={clients.length}
          sub="在管客户"
          color="var(--primary)"
          onClick={() => navigate('/list')}
        />
        <MetricCard
          title="本周需跟进"
          value={needsFollowUp}
          sub="7天以上未跟进"
          color="var(--warning)"
          onClick={() => navigate('/board')}
        />
        <MetricCard
          title="本月到期复查"
          value={reviewDue}
          sub="3个月复查时间窗"
          color="var(--accent)"
        />
        <MetricCard
          title="待处理提醒"
          value={reminders.filter(r => r.urgency === 'urgent').length}
          sub={`共 ${reminders.length} 条提醒`}
          color="var(--danger)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Stage distribution */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>各阶段客户分布</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stageCounts.map(stage => (
              <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                  阶段{stage.id}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', width: 80, flexShrink: 0 }}>
                  {stage.name}
                </div>
                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: clients.length > 0 ? `${(stage.count / clients.length) * 100}%` : '0%',
                    background: 'var(--primary)',
                    borderRadius: 4,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ width: 24, textAlign: 'right', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>
                  {stage.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            提醒列表
            {reminders.length > 0 && (
              <span style={{
                marginLeft: 8,
                fontSize: 12,
                background: 'var(--danger)',
                color: 'white',
                borderRadius: 10,
                padding: '2px 8px'
              }}>{reminders.length}</span>
            )}
          </h2>
          {reminders.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
              暂无待处理提醒 ✓
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {reminders.map((r, i) => {
                const style = urgencyStyle(r.urgency);
                return (
                  <div
                    key={i}
                    onClick={() => navigate(`/clients/${r.clientId}`)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: style.bg,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
                        {r.clientName}
                      </span>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {r.message}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11,
                      color: style.color,
                      fontWeight: 600,
                      flexShrink: 0,
                      padding: '2px 8px',
                      background: 'white',
                      borderRadius: 4
                    }}>{style.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
