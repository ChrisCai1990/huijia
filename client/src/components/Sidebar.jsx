import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: '数据总览', icon: '📊', exact: true },
  { path: '/board', label: '看板视图', icon: '📋' },
  { path: '/list', label: '客户列表', icon: '👥' },
  { path: '/clients/new', label: '新增客户', icon: '➕' }
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 220,
      background: '#1e293b',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Logo/Brand */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#f1f5f9',
          lineHeight: 1.3
        }}>汇泽甲功</div>
        <div style={{
          fontSize: 11,
          color: '#94a3b8',
          marginTop: 4,
          letterSpacing: '0.05em'
        }}>桥本氏症健康管理</div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 4,
              color: isActive ? '#fff' : '#94a3b8',
              background: isActive ? '#2563eb' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s ease',
              fontSize: 14
            })}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #334155',
        fontSize: 11,
        color: '#475569'
      }}>
        CRM v1.0
      </div>
    </aside>
  );
}
