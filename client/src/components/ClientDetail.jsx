import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { STAGES, getStageById } from '../utils/stages.js';
import { format, parseISO, isValid } from 'date-fns';

function formatDate(d) {
  if (!d) return '-';
  const parsed = parseISO(String(d));
  if (!isValid(parsed)) return String(d);
  return format(parsed, 'yyyy-MM-dd');
}

function safeParseJSON(str, fallback = []) {
  try {
    const parsed = JSON.parse(str || '[]');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// ---- Stage Progress Bar ----
function StageProgressBar({ currentStage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STAGES.map((stage, i) => {
        const done = stage.id < currentStage;
        const active = stage.id === currentStage;
        return (
          <React.Fragment key={stage.id}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: done ? 'var(--primary)' : active ? 'var(--primary)' : '#e2e8f0',
                color: done || active ? 'white' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                border: active ? '3px solid #93c5fd' : 'none',
                boxSizing: 'border-box',
                flexShrink: 0
              }}>
                {done ? '✓' : stage.id}
              </div>
              <span style={{
                fontSize: 10,
                color: active ? 'var(--primary)' : done ? 'var(--text-secondary)' : '#cbd5e1',
                fontWeight: active ? 700 : 400,
                whiteSpace: 'nowrap'
              }}>{stage.name}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{
                height: 3,
                flex: 1,
                background: done ? 'var(--primary)' : '#e2e8f0',
                marginBottom: 22
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---- Tab: Tasks ----
function TasksTab({ client, onUpdate }) {
  const stage = getStageById(client.stage);
  const completedTasks = safeParseJSON(client.completedTasks);
  const [saving, setSaving] = useState(false);

  async function toggleTask(taskId) {
    const newCompleted = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];
    setSaving(true);
    try {
      await onUpdate({ completedTasks: JSON.stringify(newCompleted) });
    } finally {
      setSaving(false);
    }
  }

  async function advanceStage() {
    if (client.stage >= 8) return;
    setSaving(true);
    try {
      await onUpdate({ stage: client.stage + 1, completedTasks: JSON.stringify([]) });
    } finally {
      setSaving(false);
    }
  }

  const allDone = stage.tasks.every(t => completedTasks.includes(t.id));

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: 600, fontSize: 15 }}>
          阶段 {stage.id}: {stage.name} — 待办任务
        </h3>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {completedTasks.filter(id => stage.tasks.some(t => t.id === id)).length} / {stage.tasks.length} 已完成
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stage.tasks.map(task => {
          const done = completedTasks.includes(task.id);
          return (
            <div
              key={task.id}
              onClick={() => !saving && toggleTask(task.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: done ? '#f0fdf4' : 'white',
                border: `1px solid ${done ? '#bbf7d0' : 'var(--border)'}`,
                borderRadius: 8,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                opacity: saving ? 0.7 : 1
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: `2px solid ${done ? 'var(--accent)' : '#d1d5db'}`,
                background: done ? 'var(--accent)' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'white',
                fontSize: 12,
                fontWeight: 700
              }}>
                {done && '✓'}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: 14,
                  color: done ? 'var(--text-secondary)' : 'var(--text)',
                  textDecoration: done ? 'line-through' : 'none'
                }}>{task.text}</span>
                {task.docRef && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '1px 6px',
                    borderRadius: 4
                  }}>{task.docRef}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDone && client.stage < 8 && (
        <div style={{
          marginTop: 20,
          padding: '16px',
          background: 'var(--accent-light)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 14 }}>所有任务已完成！</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              可以推进到下一阶段：{STAGES.find(s => s.id === client.stage + 1)?.name}
            </div>
          </div>
          <button
            onClick={advanceStage}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >推进到下一阶段 →</button>
        </div>
      )}
    </div>
  );
}

// ---- Tab: Follow-up Logs ----
function FollowUpTab({ client, onUpdate }) {
  const logs = safeParseJSON(client.followUpLogs);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState(client.manager || '健康助理');
  const [saving, setSaving] = useState(false);

  async function submitLog() {
    if (!text.trim()) return;
    const newLog = {
      date: format(new Date(), 'yyyy-MM-dd HH:mm'),
      content: text.trim(),
      author
    };
    const newLogs = [newLog, ...logs];
    const nextFollowUp = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    setSaving(true);
    try {
      await onUpdate({
        followUpLogs: JSON.stringify(newLogs),
        nextFollowUpDate: nextFollowUp
      });
      setText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>记录跟进内容</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="填写本次跟进情况、客户反馈、注意事项..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <select
            value={author}
            onChange={e => setAuthor(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              background: 'white',
              outline: 'none'
            }}
          >
            <option>健康助理</option>
            <option>营养师</option>
            <option>功能医学医生</option>
          </select>
          <button
            onClick={submitLog}
            disabled={!text.trim() || saving}
            style={{
              padding: '7px 16px',
              background: text.trim() ? 'var(--primary)' : '#e2e8f0',
              color: text.trim() ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: text.trim() && !saving ? 'pointer' : 'not-allowed'
            }}
          >{saving ? '保存中...' : '提交记录'}</button>
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
        历史记录（共 {logs.length} 条）
      </h3>
      {logs.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0', fontSize: 13 }}>暂无跟进记录</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.map((log, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: 8,
              borderLeft: '3px solid var(--primary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{log.author}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.date}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{log.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Tab: Documents ----
function DocsTab({ client }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [client.id]);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await axios.get(`/api/docs/${client.id}`);
      setDocs(res.data);
    } catch (e) {
      console.error('Failed to load docs:', e);
    } finally {
      setLoading(false);
    }
  }

  async function setupDocs() {
    setSettingUp(true);
    try {
      const res = await axios.post(`/api/docs/setup/${client.id}`);
      if (res.data.documents) {
        setDocs(res.data.documents);
      }
      alert('文档结构创建成功！');
    } catch (e) {
      alert('创建失败: ' + (e.response?.data?.error || e.message));
    } finally {
      setSettingUp(false);
    }
  }

  const DOC_TEMPLATES = [
    '01-健康档案', '02-基础检测报告解读', '03-个性化干预方案',
    '04-饮食调理计划', '05-营养素补充方案', '06-生活方式建议',
    '07-运动康复计划', '08-压力管理方案', '09-3个月复查报告',
    '10-6个月复查报告', '11-阶段性总结与调整'
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, fontSize: 15 }}>文档中心</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {client.folderLink && (
            <a
              href={client.folderLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '7px 12px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >打开飞书文件夹</a>
          )}
          <button
            onClick={setupDocs}
            disabled={settingUp}
            style={{
              padding: '7px 12px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: settingUp ? 'not-allowed' : 'pointer',
              opacity: settingUp ? 0.7 : 1
            }}
          >{settingUp ? '创建中...' : '初始化文档结构'}</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>加载中...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {DOC_TEMPLATES.map((title, i) => {
            const doc = docs.find(d => d.title === title || d.name === title);
            const hasLink = doc && (doc.url || doc.token);
            const docUrl = doc?.url || (doc?.token ? `https://docs.feishu.cn/docx/${doc.token}` : null);
            return (
              <div key={i} style={{
                padding: '14px',
                background: hasLink ? 'white' : '#f8fafc',
                border: `1px solid ${hasLink ? 'var(--border)' : '#e2e8f0'}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  background: hasLink ? 'var(--primary-light)' : '#f1f5f9',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0
                }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: hasLink ? 'var(--text)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{title}</div>
                  {hasLink ? (
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}
                    >打开文档 →</a>
                  ) : (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>未创建</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Tab: Review Records ----
function ReviewTab({ client, onUpdate }) {
  const [values, setValues] = useState({
    tsh: client.tsh || '',
    tpoab: client.tpoab || '',
    tgab: client.tgab || '',
    tshRecheck: client.tshRecheck || '',
    tpoabRecheck: client.tpoabRecheck || '',
    tgabRecheck: client.tgabRecheck || ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(field, val) {
    setValues(v => ({ ...v, [field]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(values);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const rows = [
    { label: 'TSH', before: 'tsh', recheck: 'tshRecheck', unit: 'mIU/L', normalRange: '0.5-4.5' },
    { label: 'TPOAb', before: 'tpoab', recheck: 'tpoabRecheck', unit: 'IU/mL', normalRange: '<35' },
    { label: 'TgAb', before: 'tgab', recheck: 'tgabRecheck', unit: 'IU/mL', normalRange: '<40' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, fontSize: 15 }}>复查记录</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '7px 16px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >{saving ? '保存中...' : saved ? '已保存 ✓' : '保存数据'}</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>指标</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>参考范围</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--primary)', border: '1px solid var(--border)' }}>干预前</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--accent)', border: '1px solid var(--border)' }}>3个月复查</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <td style={{ padding: '12px 16px', border: '1px solid var(--border)', fontWeight: 600 }}>
                  {row.label}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 4 }}>({row.unit})</span>
                </td>
                <td style={{ padding: '12px 16px', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13 }}>
                  {row.normalRange}
                </td>
                <td style={{ padding: '8px 16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <input
                    type="text"
                    value={values[row.before]}
                    onChange={e => handleChange(row.before, e.target.value)}
                    placeholder="填入数值"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 14,
                      textAlign: 'center',
                      outline: 'none',
                      background: '#fafafa'
                    }}
                  />
                </td>
                <td style={{ padding: '8px 16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <input
                    type="text"
                    value={values[row.recheck]}
                    onChange={e => handleChange(row.recheck, e.target.value)}
                    placeholder="填入数值"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 14,
                      textAlign: 'center',
                      outline: 'none',
                      background: values[row.recheck] ? '#f0fdf4' : '#fafafa'
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trend indicator */}
      {(values.tshRecheck || values.tpoabRecheck || values.tgabRecheck) && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 13, marginBottom: 8 }}>变化趋势</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {rows.map(row => {
              const before = parseFloat(values[row.before]);
              const after = parseFloat(values[row.recheck]);
              if (!before || !after) return null;
              const change = ((after - before) / before * 100).toFixed(1);
              const improved = row.label === 'TSH'
                ? (after >= 0.5 && after <= 4.5 && Math.abs(after - 2.5) < Math.abs(before - 2.5))
                : after < before;
              return (
                <div key={row.label} style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}: </span>
                  <span style={{ color: improved ? 'var(--accent)' : 'var(--danger)', fontWeight: 600 }}>
                    {before} → {after} ({change > 0 ? '+' : ''}{change}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main ClientDetail ----
export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');

  const loadClient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/clients/${id}`);
      setClient(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadClient(); }, [loadClient]);

  const handleUpdate = useCallback(async (data) => {
    const updated = { ...client, ...data };
    const res = await axios.put(`/api/clients/${id}`, updated);
    setClient(res.data);
    return res.data;
  }, [client, id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>加载中...</div>;
  if (error) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: 'var(--danger)', marginBottom: 12 }}>加载失败: {error}</div>
      <button onClick={() => navigate('/list')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← 返回列表</button>
    </div>
  );
  if (!client) return null;

  const stage = getStageById(client.stage);

  const tabs = [
    { id: 'tasks', label: '本阶段待办' },
    { id: 'followup', label: '跟进记录' },
    { id: 'docs', label: '文档中心' },
    { id: 'review', label: '复查记录' }
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: 'var(--text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          marginBottom: 16,
          padding: 0
        }}
      >← 返回</button>

      {/* Client info header card */}
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow)',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0
            }}>
              {client.name?.[0] || '?'}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{client.name}</h1>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                {client.age ? `${client.age}岁 · ` : ''}
                {client.gender || ''}
                {client.phone ? ` · ${client.phone}` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate(`/clients/${id}/edit`)}
              style={{
                padding: '8px 16px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >编辑</button>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: '服务方案', value: client.serviceType },
            { label: '负责人', value: client.manager },
            { label: '加入日期', value: formatDate(client.joinDate) },
            { label: '下次跟进', value: formatDate(client.nextFollowUpDate) },
            { label: 'TSH', value: client.tsh ? `${client.tsh} mIU/L` : '-' },
            { label: 'TPOAb', value: client.tpoab ? `${client.tpoab} IU/mL` : '-' },
            { label: 'TgAb', value: client.tgab ? `${client.tgab} IU/mL` : '-' },
            { label: '确诊时间', value: client.diagnosisTime || '-' }
          ].map(item => (
            <div key={item.label} style={{
              padding: '10px 14px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{item.value || '-'}</div>
            </div>
          ))}
        </div>

        {/* Stage progress */}
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <StageProgressBar currentStage={client.stage} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 20px',
                border: 'none',
                background: 'none',
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: -1,
                transition: 'all 0.15s'
              }}
            >{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {activeTab === 'tasks' && <TasksTab client={client} onUpdate={handleUpdate} />}
          {activeTab === 'followup' && <FollowUpTab client={client} onUpdate={handleUpdate} />}
          {activeTab === 'docs' && <DocsTab client={client} />}
          {activeTab === 'review' && <ReviewTab client={client} onUpdate={handleUpdate} />}
        </div>
      </div>
    </div>
  );
}
