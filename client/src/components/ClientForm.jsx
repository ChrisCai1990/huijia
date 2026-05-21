import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const SERVICE_TYPES = ['年度服务', '检测套餐', '营养素'];
const MANAGERS = ['健康助理', '营养师', '功能医学医生'];
const GENDERS = ['女', '男'];

function FormField({ label, required, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
        {label}
        {required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    padding: '9px 12px',
    border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    background: 'white',
    transition: 'border-color 0.15s'
  };
}

function SectionHeader({ title }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      paddingBottom: 8,
      borderBottom: '2px solid var(--primary-light)',
      marginBottom: 4
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{title}</h3>
    </div>
  );
}

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '女',
    phone: '',
    serviceType: '年度服务',
    manager: '健康助理',
    joinDate: new Date().toISOString().split('T')[0],
    diagnosisTime: '',
    tsh: '',
    tpoab: '',
    tgab: '',
    symptoms: '',
    mainGoal: '',
    medications: '',
    notes: '',
    stage: 1,
    completedTasks: '[]',
    followUpLogs: '[]',
    folderLink: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      axios.get(`/api/clients/${id}`)
        .then(res => {
          const data = res.data;
          setForm({
            name: data.name || '',
            age: data.age || '',
            gender: data.gender || '女',
            phone: data.phone || '',
            serviceType: data.serviceType || '年度服务',
            manager: data.manager || '健康助理',
            joinDate: data.joinDate || '',
            diagnosisTime: data.diagnosisTime || '',
            tsh: data.tsh || '',
            tpoab: data.tpoab || '',
            tgab: data.tgab || '',
            symptoms: data.symptoms || '',
            mainGoal: data.mainGoal || '',
            medications: data.medications || '',
            notes: data.notes || '',
            stage: data.stage || 1,
            completedTasks: data.completedTasks || '[]',
            followUpLogs: data.followUpLogs || '[]',
            folderLink: data.folderLink || ''
          });
        })
        .catch(e => setFetchError(e.response?.data?.error || e.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = '请填写客户姓名';
    if (!form.serviceType) errs.serviceType = '请选择服务方案';
    if (!form.manager) errs.manager = '请选择负责人';
    if (!form.joinDate) errs.joinDate = '请填写加入日期';
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120)) {
      errs.age = '请填写有效年龄（1-120）';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : '',
        stage: Number(form.stage) || 1
      };

      if (isEdit) {
        await axios.put(`/api/clients/${id}`, payload);
        navigate(`/clients/${id}`);
      } else {
        const res = await axios.post('/api/clients', payload);
        const newId = res.data.id;
        // Create Feishu docs
        try {
          await axios.post(`/api/docs/setup/${newId}`);
        } catch (e) {
          console.warn('Docs setup failed (non-fatal):', e.message);
        }
        navigate(`/clients/${newId}`);
      }
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>加载中...</div>;
  if (fetchError) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: 'var(--danger)' }}>加载失败: {fetchError}</div>
      <button onClick={() => navigate(-1)} style={{ marginTop: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>← 返回</button>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          color: 'var(--text-secondary)', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0
        }}
      >← 返回</button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{isEdit ? '编辑客户信息' : '新增客户'}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          {isEdit ? '修改客户信息后点击保存' : '填写客户基础信息，创建后将自动生成文档结构'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            <SectionHeader title="基础信息" />

            <FormField label="客户姓名" required error={errors.name}>
              <input
                style={inputStyle(!!errors.name)}
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="请输入客户姓名"
              />
            </FormField>

            <FormField label="年龄" error={errors.age}>
              <input
                style={inputStyle(!!errors.age)}
                type="number"
                value={form.age}
                onChange={e => handleChange('age', e.target.value)}
                placeholder="请输入年龄"
                min="1"
                max="120"
              />
            </FormField>

            <FormField label="性别">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', height: 38 }}>
                {GENDERS.map(g => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={() => handleChange('gender', g)}
                      style={{ cursor: 'pointer' }}
                    />
                    {g}
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="联系电话">
              <input
                style={inputStyle(false)}
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="手机号码"
              />
            </FormField>

            <FormField label="服务方案" required error={errors.serviceType}>
              <select
                style={inputStyle(!!errors.serviceType)}
                value={form.serviceType}
                onChange={e => handleChange('serviceType', e.target.value)}
              >
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>

            <FormField label="负责人" required error={errors.manager}>
              <select
                style={inputStyle(!!errors.manager)}
                value={form.manager}
                onChange={e => handleChange('manager', e.target.value)}
              >
                {MANAGERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FormField>

            <FormField label="加入日期" required error={errors.joinDate}>
              <input
                style={inputStyle(!!errors.joinDate)}
                type="date"
                value={form.joinDate}
                onChange={e => handleChange('joinDate', e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            <SectionHeader title="健康背景" />

            <FormField label="桥本确诊时间">
              <input
                style={inputStyle(false)}
                value={form.diagnosisTime}
                onChange={e => handleChange('diagnosisTime', e.target.value)}
                placeholder="如：2023-06"
              />
            </FormField>

            <FormField label="TSH (mIU/L)">
              <input
                style={inputStyle(false)}
                value={form.tsh}
                onChange={e => handleChange('tsh', e.target.value)}
                placeholder="如：8.5"
              />
            </FormField>

            <FormField label="TPOAb (IU/mL)">
              <input
                style={inputStyle(false)}
                value={form.tpoab}
                onChange={e => handleChange('tpoab', e.target.value)}
                placeholder="如：320"
              />
            </FormField>

            <FormField label="TgAb (IU/mL)">
              <input
                style={inputStyle(false)}
                value={form.tgab}
                onChange={e => handleChange('tgab', e.target.value)}
                placeholder="如：180"
              />
            </FormField>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px 20px' }}>
            <SectionHeader title="症状信息" />

            <FormField label="主要症状">
              <textarea
                style={{ ...inputStyle(false), resize: 'vertical', minHeight: 80 }}
                value={form.symptoms}
                onChange={e => handleChange('symptoms', e.target.value)}
                placeholder="如：乏力、怕冷、脱发、体重增加..."
                rows={3}
              />
            </FormField>

            <FormField label="最希望改善的问题">
              <textarea
                style={{ ...inputStyle(false), resize: 'vertical', minHeight: 80 }}
                value={form.mainGoal}
                onChange={e => handleChange('mainGoal', e.target.value)}
                placeholder="客户最关注的健康目标..."
                rows={3}
              />
            </FormField>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow)', marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px 20px' }}>
            <SectionHeader title="其他信息" />

            <FormField label="目前用药情况">
              <textarea
                style={{ ...inputStyle(false), resize: 'vertical', minHeight: 70 }}
                value={form.medications}
                onChange={e => handleChange('medications', e.target.value)}
                placeholder="如：优甲乐 25mcg/天，无其他用药..."
                rows={2}
              />
            </FormField>

            <FormField label="备注">
              <textarea
                style={{ ...inputStyle(false), resize: 'vertical', minHeight: 70 }}
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="其他需要记录的信息..."
                rows={2}
              />
            </FormField>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'white',
              fontSize: 14,
              cursor: 'pointer',
              color: 'var(--text)'
            }}
          >取消</button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 24px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1
            }}
          >{submitting ? '保存中...' : isEdit ? '保存修改' : '创建客户'}</button>
        </div>
      </form>
    </div>
  );
}
