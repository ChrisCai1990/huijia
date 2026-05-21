import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Board from './components/Board.jsx';
import ClientList from './components/ClientList.jsx';
import ClientDetail from './components/ClientDetail.jsx';
import ClientForm from './components/ClientForm.jsx';

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg)'
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/board" element={<Board />} />
          <Route path="/list" element={<ClientList />} />
          <Route path="/clients/new" element={<ClientForm />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/edit" element={<ClientForm />} />
        </Routes>
      </main>
    </div>
  );
}
