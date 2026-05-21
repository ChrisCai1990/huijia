import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients.js';
import { STAGES } from '../utils/stages.js';
import { differenceInDays, parseISO, isValid, format } from 'date-fns';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = parseISO(String(dateStr));
  if (!isValid(d)) return dateStr;
  return format(d, 'yyyy-MM-dd');
}

function needsFollowUp(client) {
  if (!client.nextFollowUpDate) return false;
  const d = parseISO(String(client.nextFollowUpDate));
  if (!isValid(d)) return false;
  return differenceInDays(new Date(), d) >= 7;
}

const SORT_FIELDS = {
  name: '姓名',
  age: '年龄',
  stage: '阶段',
  joinDate: '加入日期',
  nextFollowUpDate: '下次跟进'
};

export default function ClientList() {
  const { clients, loading, error, fetchClients, deleteClient } = useClients();
  const navigate = useNavigate();

  const [sortField, setSortField] = useState('joinDate');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const managers = useMemo(() => {
    const set = new Set(clients.map(c => c.manager).filter(Boolean));
    return Array.from(set);
  }, [clients]);

  const filtered = useMemo(() => {
    let list = [...clients];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.manager?.toLowerCase().includes(q)
      );
    }
    if (stageFilter) list = list.filter(c => String(c.stage) === stageFilter);
    if (managerFilter) list = list.filter(c => c.manager === managerFilter);

    list.sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === 'age' || sortField === 'stage') {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      } else {
        av = String(av || '');
        bv = String(bv || '');
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [clients, search, stageFilter, managerFilter, sortField, sortDir]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function exportCSV() {
    const headers = ['姓名', '年龄', '性别', '电话', '服务方案', '阶段', '负责人', '加入日期', '下次跟进', 'TSH', 'TPOAb', 'TgAb'];
    const rows = filtered.map(c => [
      c.name, c.age, c.gender, c.phone, c.serviceType,
      STAGES.find(s => s.id === c.stage)?.name || c.stage,
      c.manager, formatDate(c.joinDate), formatDate(c.nextFollowUpDate),
      c.tsh, c.tpoab, c.tgab
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `汇泽甲功客户列表_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  }

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteClient(id);
      setDeleteConfirm(null);
    } catch (e) {
      alert('删除失败: ' + e.message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>加载中...</div>;
  if (error) return <div style={{ padding: 40, color: 'var(--danger)' }}>错误: {error}</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>客户列表</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
            共 {filtered.length} / {clients.length} 位客户
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={exportCSV}
            style={{
              padding: '8px 14px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'white',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--text)'
            }}
          >导出 CSV</button>
          <button
            onClick={() => navigate('/clients/new')}
            style={{
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13
            }}
          >+ 新增客户</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="搜索姓名/电话/负责人..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '7px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
            width: 200,
            outline: 'none'
          }}
        />
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          style={{
            padding: '7px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
            background: 'white',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">所有阶段</option>
          {STAGES.map(s => <option key={s.id} value={String(s.id)}>阶段{s.id} {s.name}</option>)}
        </select>
        <select
          value={managerFilter}
          onChange={e => setManagerFilter(e.target.value)}
          style={{
            padding: '7px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
            background: 'white',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">所有负责人</option>
          {managers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(search || stageFilter || managerFilter) && (
          <button
            onClick={() => { setSearch(''); setStageFilter(''); setManagerFilter(''); }}
            style={{
              padding: '7px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              background: 'white',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >清除</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                {['name', 'age', 'serviceType', 'stage', 'manager', 'joinDate', 'nextFollowUpDate'].map(field => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {{
                      name: '姓名', age: '年龄', serviceType: '服务方案',
                      stage: '阶段', manager: '负责人',
                      joinDate: '加入日期', nextFollowUpDate: '下次跟进'
                    }[field]}
                    {sortField === field && (
                      <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    暂无数据
                  </td>
                </tr>
              )}
              {filtered.map((client, idx) => {
                const overdue = needsFollowUp(client);
                const stage = STAGES.find(s => s.id === client.stage);
                return (
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: idx % 2 === 0 ? 'white' : '#fafafa',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafafa'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>
                      {client.name}
                      {overdue && (
                        <span style={{
                          marginLeft: 6,
                          fontSize: 11,
                          background: 'var(--warning-light)',
                          color: 'var(--warning)',
                          padding: '1px 5px',
                          borderRadius: 4
                        }}>待跟进</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{client.age || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {client.serviceType && (
                        <span style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'var(--primary-light)',
                          color: 'var(--primary)'
                        }}>{client.serviceType}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#f1f5f9',
                        color: 'var(--text-secondary)'
                      }}>
                        {stage ? `${stage.id}. ${stage.name}` : client.stage}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{client.manager || '-'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(client.joinDate)}</td>
                    <td style={{
                      padding: '12px 16px',
                      color: overdue ? 'var(--warning)' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: overdue ? 600 : 400
                    }}>{formatDate(client.nextFollowUpDate)}</td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => navigate(`/clients/${client.id}/edit`)}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >编辑</button>
                        <button
                          onClick={() => setDeleteConfirm(client.id)}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >删除</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            width: 340,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>确认删除</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
              确定要删除客户「{clients.find(c => c.id === deleteConfirm)?.name}」吗？此操作无法撤销。
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >取消</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1
                }}
              >{deleting ? '删除中...' : '确认删除'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
