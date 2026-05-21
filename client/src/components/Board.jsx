import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useClients } from '../hooks/useClients.js';
import { STAGES } from '../utils/stages.js';
import { differenceInDays, parseISO, isValid } from 'date-fns';

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(String(dateStr));
  if (!isValid(d)) return null;
  return differenceInDays(new Date(), d);
}

function needsFollowUp(client) {
  if (!client.nextFollowUpDate) return false;
  const days = daysSince(client.nextFollowUpDate);
  return days !== null && days >= 7;
}

function serviceTypeBadgeColor(type) {
  if (type === '年度服务') return { bg: '#dbeafe', color: '#1d4ed8' };
  if (type === '检测套餐') return { bg: '#dcfce7', color: '#15803d' };
  if (type === '营养素') return { bg: '#fef9c3', color: '#a16207' };
  return { bg: '#f1f5f9', color: '#475569' };
}

function ClientCard({ client, isDragging }) {
  const navigate = useNavigate();
  const daysIn = daysSince(client.joinDate);
  const overdue = needsFollowUp(client);
  const badge = serviceTypeBadgeColor(client.serviceType);
  const stageProgress = Math.round(((client.stage || 1) / 8) * 100);

  return (
    <div
      onClick={() => !isDragging && navigate(`/clients/${client.id}`)}
      style={{
        background: 'white',
        borderRadius: 8,
        padding: '12px 14px',
        boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.15)' : 'var(--shadow)',
        cursor: isDragging ? 'grabbing' : 'pointer',
        marginBottom: 8,
        borderLeft: overdue ? '3px solid var(--warning)' : '3px solid transparent',
        opacity: isDragging ? 0.9 : 1
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{client.name}</span>
        {overdue && (
          <span style={{
            fontSize: 11,
            background: 'var(--warning-light)',
            color: 'var(--warning)',
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 600,
            flexShrink: 0,
            marginLeft: 4
          }}>待跟进</span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {client.serviceType && (
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            background: badge.bg,
            color: badge.color,
            fontWeight: 500
          }}>{client.serviceType}</span>
        )}
        {client.manager && (
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            background: '#f1f5f9',
            color: 'var(--text-secondary)'
          }}>{client.manager}</span>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', gap: 12 }}>
        {daysIn !== null && <span>入组 {daysIn} 天</span>}
        {client.tpoab && <span>TPOAb: {client.tpoab}</span>}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${stageProgress}%`,
            background: 'var(--primary)',
            borderRadius: 2
          }} />
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
          服务进度 {stageProgress}%
        </div>
      </div>
    </div>
  );
}

function SortableCard({ client }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: client.id,
    data: { client, stage: client.stage }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ClientCard client={client} isDragging={false} />
    </div>
  );
}

function StageColumn({ stage, clients, isOver }) {
  return (
    <div style={{
      minWidth: 220,
      maxWidth: 240,
      flexShrink: 0,
      background: isOver ? '#eff6ff' : '#f8fafc',
      borderRadius: 'var(--radius-lg)',
      border: isOver ? '2px dashed var(--primary)' : '2px solid transparent',
      transition: 'border-color 0.15s, background 0.15s'
    }}>
      {/* Column header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>阶段 {stage.id}</span>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{stage.name}</div>
        </div>
        <span style={{
          background: clients.length > 0 ? 'var(--primary)' : '#e2e8f0',
          color: clients.length > 0 ? 'white' : '#94a3b8',
          borderRadius: 12,
          padding: '2px 8px',
          fontSize: 12,
          fontWeight: 600,
          minWidth: 24,
          textAlign: 'center'
        }}>{clients.length}</span>
      </div>

      {/* Cards */}
      <div style={{ padding: '10px', minHeight: 80 }}>
        <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {clients.map(client => (
            <SortableCard key={client.id} client={client} />
          ))}
        </SortableContext>
        {clients.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '20px 0',
            color: '#cbd5e1',
            fontSize: 12
          }}>暂无客户</div>
        )}
      </div>
    </div>
  );
}

export default function Board() {
  const { clients, loading, error, fetchClients, updateClient } = useClients();
  const navigate = useNavigate();

  const [managerFilter, setManagerFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const managers = useMemo(() => {
    const set = new Set(clients.map(c => c.manager).filter(Boolean));
    return Array.from(set);
  }, [clients]);

  const serviceTypes = useMemo(() => {
    const set = new Set(clients.map(c => c.serviceType).filter(Boolean));
    return Array.from(set);
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (managerFilter && c.manager !== managerFilter) return false;
      if (serviceFilter && c.serviceType !== serviceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!c.name?.toLowerCase().includes(q) && !c.phone?.includes(q)) return false;
      }
      return true;
    });
  }, [clients, managerFilter, serviceFilter, searchQuery]);

  const activeClient = useMemo(() => {
    if (!activeId) return null;
    return clients.find(c => c.id === activeId) || null;
  }, [activeId, clients]);

  const overStage = useMemo(() => {
    if (!overId) return null;
    const stage = STAGES.find(s => `stage-${s.id}` === overId);
    if (stage) return stage.id;
    const clientInCol = clients.find(c => c.id === overId);
    return clientInCol ? clientInCol.stage : null;
  }, [overId, clients]);

  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  function handleDragOver({ over }) {
    setOverId(over ? over.id : null);
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;

    const draggedClient = clients.find(c => c.id === active.id);
    if (!draggedClient) return;

    // Determine target stage
    let targetStage = null;
    const stageFromId = STAGES.find(s => `stage-${s.id}` === over.id);
    if (stageFromId) {
      targetStage = stageFromId.id;
    } else {
      const targetClient = clients.find(c => c.id === over.id);
      if (targetClient && targetClient.stage !== draggedClient.stage) {
        targetStage = targetClient.stage;
      }
    }

    if (targetStage && targetStage !== draggedClient.stage) {
      try {
        await updateClient(draggedClient.id, { ...draggedClient, stage: targetStage });
      } catch (err) {
        console.error('Failed to update client stage:', err);
      }
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>加载中...</div>;
  if (error) return <div style={{ padding: 40, color: 'var(--danger)' }}>错误: {error}</div>;

  return (
    <div style={{ padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>看板视图</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
            共 {filteredClients.length} 位客户
          </p>
        </div>
        <button
          onClick={() => navigate('/clients/new')}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: 14
          }}
        >+ 新增客户</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexShrink: 0, flexWrap: 'wrap' }}>
        <input
          placeholder="搜索姓名或电话..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
            width: 180,
            outline: 'none'
          }}
        />
        <select
          value={managerFilter}
          onChange={e => setManagerFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
            background: 'white',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="">所有负责人</option>
          {managers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
            background: 'white',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="">所有服务方案</option>
          {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(managerFilter || serviceFilter || searchQuery) && (
          <button
            onClick={() => { setManagerFilter(''); setServiceFilter(''); setSearchQuery(''); }}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              background: 'white',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >清除筛选</button>
        )}
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 14, minWidth: 'max-content', height: '100%', paddingBottom: 16 }}>
            {STAGES.map(stage => {
              const stageClients = filteredClients.filter(c => c.stage === stage.id);
              return (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  clients={stageClients}
                  isOver={overStage === stage.id}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeClient && <ClientCard client={activeClient} isDragging={true} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
