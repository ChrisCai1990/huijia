import { useState, useCallback } from 'react';
import axios from 'axios';

export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/clients');
      setClients(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || '获取客户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (data) => {
    const res = await axios.post('/api/clients', data);
    setClients(prev => [...prev, res.data]);
    return res.data;
  }, []);

  const updateClient = useCallback(async (id, data) => {
    const res = await axios.put(`/api/clients/${id}`, data);
    setClients(prev => prev.map(c => c.id === id ? res.data : c));
    return res.data;
  }, []);

  const deleteClient = useCallback(async (id) => {
    await axios.delete(`/api/clients/${id}`);
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  return { clients, loading, error, fetchClients, createClient, updateClient, deleteClient };
}
