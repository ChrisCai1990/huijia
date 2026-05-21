const express = require('express');
const router = express.Router();
const bitable = require('../services/bitable');
const drive = require('../services/drive');
const config = require('../config');

// Field mapping: Feishu Chinese field names → JS property names
const FIELD_MAP = {
  '客户姓名': 'name',
  '年龄': 'age',
  '性别': 'gender',
  '联系电话': 'phone',
  '服务方案': 'serviceType',
  '负责人': 'manager',
  '当前阶段': 'stage',
  '加入日期': 'joinDate',
  '报告出具日期': 'reportDate',
  '下次跟进日期': 'nextFollowUpDate',
  '桥本确诊时间': 'diagnosisTime',
  'TSH': 'tsh',
  'TPOAb': 'tpoab',
  'TgAb': 'tgab',
  'TSH复查': 'tshRecheck',
  'TPOAb复查': 'tpoabRecheck',
  'TgAb复查': 'tgabRecheck',
  '主要症状': 'symptoms',
  '最希望改善的问题': 'mainGoal',
  '目前用药情况': 'medications',
  '已完成任务': 'completedTasks',
  '跟进记录': 'followUpLogs',
  '飞书文件夹链接': 'folderLink',
  '备注': 'notes'
};

const REVERSE_FIELD_MAP = Object.fromEntries(
  Object.entries(FIELD_MAP).map(([k, v]) => [v, k])
);

function feishuToClient(record) {
  const fields = record.fields || {};
  const client = { id: record.record_id };
  for (const [cnKey, jsKey] of Object.entries(FIELD_MAP)) {
    let val = fields[cnKey];
    if (val === undefined || val === null) {
      client[jsKey] = jsKey === 'stage' ? 1 : '';
    } else {
      // Feishu may return arrays for some field types
      if (Array.isArray(val)) {
        if (val.length > 0 && val[0] && typeof val[0] === 'object' && val[0].text !== undefined) {
          val = val.map(v => v.text).join('');
        } else if (val.length === 1) {
          val = val[0];
        }
      }
      client[jsKey] = val;
    }
  }
  // Ensure stage is a number
  client.stage = parseInt(client.stage) || 1;
  return client;
}

function clientToFeishu(data) {
  const fields = {};
  for (const [jsKey, cnKey] of Object.entries(REVERSE_FIELD_MAP)) {
    if (data[jsKey] !== undefined && data[jsKey] !== null && data[jsKey] !== '') {
      fields[cnKey] = data[jsKey];
    }
  }
  return fields;
}

// Mock data for demo mode (when Feishu is not configured)
const mockClients = [
  {
    id: 'mock_001',
    name: '张小梅',
    age: 34,
    gender: '女',
    phone: '13800138001',
    serviceType: '年度服务',
    manager: '营养师',
    stage: 5,
    joinDate: '2024-01-15',
    reportDate: '2024-02-01',
    nextFollowUpDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diagnosisTime: '2023-06',
    tsh: '8.5',
    tpoab: '320',
    tgab: '180',
    tshRecheck: '',
    tpoabRecheck: '',
    tgabRecheck: '',
    symptoms: '乏力，怕冷，脱发，体重增加',
    mainGoal: '改善乏力症状，控制抗体水平',
    medications: '优甲乐 25mcg/天',
    completedTasks: JSON.stringify([]),
    followUpLogs: JSON.stringify([
      { date: '2024-02-15', content: '客户反馈乏力有所改善，继续执行方案', author: '营养师' },
      { date: '2024-01-20', content: '初次跟进，了解基本情况', author: '健康助理' }
    ]),
    folderLink: '',
    notes: '对饮食调整配合度高'
  },
  {
    id: 'mock_002',
    name: '李慧芳',
    age: 42,
    gender: '女',
    phone: '13900139002',
    serviceType: '年度服务',
    manager: '功能医学医生',
    stage: 3,
    joinDate: '2024-02-20',
    reportDate: '',
    nextFollowUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diagnosisTime: '2022-11',
    tsh: '12.3',
    tpoab: '580',
    tgab: '420',
    tshRecheck: '',
    tpoabRecheck: '',
    tgabRecheck: '',
    symptoms: '严重乏力，月经不调，情绪低落，便秘',
    mainGoal: '调节月经，改善情绪',
    medications: '无',
    completedTasks: JSON.stringify([]),
    followUpLogs: JSON.stringify([
      { date: '2024-03-01', content: '样本已寄出，等待结果', author: '健康助理' }
    ]),
    folderLink: '',
    notes: '病程较长，需要更细致的跟进'
  },
  {
    id: 'mock_003',
    name: '王丽娜',
    age: 28,
    gender: '女',
    phone: '13700137003',
    serviceType: '检测套餐',
    manager: '健康助理',
    stage: 1,
    joinDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reportDate: '',
    nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diagnosisTime: '2024-01',
    tsh: '5.8',
    tpoab: '156',
    tgab: '90',
    tshRecheck: '',
    tpoabRecheck: '',
    tgabRecheck: '',
    symptoms: '轻度乏力，手脚冰凉',
    mainGoal: '了解身体状态，预防病情进展',
    medications: '无',
    completedTasks: JSON.stringify([]),
    followUpLogs: JSON.stringify([]),
    folderLink: '',
    notes: '刚刚确诊，比较焦虑'
  },
  {
    id: 'mock_004',
    name: '陈美玲',
    age: 38,
    gender: '女',
    phone: '13600136004',
    serviceType: '年度服务',
    manager: '营养师',
    stage: 7,
    joinDate: '2023-09-10',
    reportDate: '2023-09-28',
    nextFollowUpDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diagnosisTime: '2021-03',
    tsh: '3.2',
    tpoab: '95',
    tgab: '60',
    tshRecheck: '2.8',
    tpoabRecheck: '72',
    tgabRecheck: '45',
    symptoms: '轻度乏力（改善中），偶有失眠',
    mainGoal: '继续降低抗体，维持改善成果',
    medications: '优甲乐 12.5mcg/天（减量中）',
    completedTasks: JSON.stringify([]),
    followUpLogs: JSON.stringify([
      { date: '2024-03-10', content: '3个月复查结果很好，抗体大幅下降', author: '功能医学医生' },
      { date: '2024-02-15', content: '执行情况良好，睡眠改善明显', author: '营养师' },
      { date: '2024-01-10', content: '方案落地顺利，客户配合度很高', author: '营养师' }
    ]),
    folderLink: '',
    notes: '效果优秀，可作为案例'
  },
  {
    id: 'mock_005',
    name: '赵文慧',
    age: 45,
    gender: '女',
    phone: '13500135005',
    serviceType: '营养素',
    manager: '健康助理',
    stage: 6,
    joinDate: '2023-11-01',
    reportDate: '2023-11-18',
    nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diagnosisTime: '2020-08',
    tsh: '6.1',
    tpoab: '240',
    tgab: '130',
    tshRecheck: '',
    tpoabRecheck: '',
    tgabRecheck: '',
    symptoms: '乏力，脱发，体重增加，记忆力下降',
    mainGoal: '改善脱发，提升精力',
    medications: '优甲乐 50mcg/天',
    completedTasks: JSON.stringify([]),
    followUpLogs: JSON.stringify([
      { date: '2024-02-28', content: '脱发情况有所改善，客户很高兴', author: '健康助理' },
      { date: '2024-01-25', content: '营养素补充方案执行中', author: '健康助理' }
    ]),
    folderLink: '',
    notes: '对营养素依从性较好'
  },
  {
    id: 'mock_006',
    name: '孙晓燕',
    age: 31,
    gender: '女',
    phone: '13400134006',
    serviceType: '年度服务',
    manager: '功能医学医生',
    stage: 4,
    joinDate: '2024-01-08',
    reportDate: '2024-01-25',
    nextFollowUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diagnosisTime: '2023-10',
    tsh: '9.7',
    tpoab: '440',
    tgab: '280',
    tshRecheck: '',
    tpoabRecheck: '',
    tgabRecheck: '',
    symptoms: '乏力，怕冷，浮肿，脱发',
    mainGoal: '整体改善，减少药量',
    medications: '优甲乐 37.5mcg/天',
    completedTasks: JSON.stringify([]),
    followUpLogs: JSON.stringify([
      { date: '2024-02-05', content: '报告解读完成，客户已理解干预思路', author: '功能医学医生' }
    ]),
    folderLink: '',
    notes: '年轻，恢复潜力好'
  },
  {
    id: 'mock_007',
    name: '吴桂兰',
    age: 52,
    gender: '女',
    phone: '13300133007',
    serviceType: '年度服务',
    manager: '营养师',
    stage: 8,
    joinDate: '2023-06-15',
    reportDate: '2023-07-02',
    nextFollowUpDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diagnosisTime: '2019-05',
    tsh: '2.5',
    tpoab: '68',
    tgab: '32',
    tshRecheck: '2.1',
    tpoabRecheck: '52',
    tgabRecheck: '28',
    symptoms: '症状基本消失，偶有轻微乏力',
    mainGoal: '维持改善成果，逐步停药',
    medications: '优甲乐 12.5mcg/天（考虑停药）',
    completedTasks: JSON.stringify([]),
    followUpLogs: JSON.stringify([
      { date: '2024-03-05', content: '6个月复查抗体已接近正常范围', author: '功能医学医生' },
      { date: '2024-01-15', content: '效果持续巩固中', author: '营养师' }
    ]),
    folderLink: '',
    notes: '治疗效果显著，准备进入复查阶段总结'
  }
];

// In-memory store for mock mode
let mockStore = [...mockClients];
let mockIdCounter = mockStore.length + 1;

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    if (!config.isConfigured()) {
      return res.json(mockStore);
    }

    const records = await bitable.getRecords();
    const clients = records.map(feishuToClient);
    res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    if (!config.isConfigured()) {
      const client = mockStore.find(c => c.id === req.params.id);
      if (!client) return res.status(404).json({ error: 'Client not found' });
      return res.json(client);
    }

    const record = await bitable.getRecord(req.params.id);
    res.json(feishuToClient(record));
  } catch (err) {
    console.error('Error fetching client:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    if (!config.isConfigured()) {
      const newClient = {
        id: `mock_${String(mockIdCounter++).padStart(3, '0')}`,
        stage: 1,
        completedTasks: JSON.stringify([]),
        followUpLogs: JSON.stringify([]),
        folderLink: '',
        ...req.body
      };
      mockStore.push(newClient);
      return res.status(201).json(newClient);
    }

    const fields = clientToFeishu(req.body);
    const record = await bitable.createRecord(fields);
    const client = feishuToClient(record);

    // Create Feishu folder for this client
    if (config.FEISHU_ROOT_FOLDER_TOKEN && client.name) {
      try {
        const folder = await drive.createFolder(
          `${client.name}-${client.id}`,
          config.FEISHU_ROOT_FOLDER_TOKEN
        );
        const folderUrl = `https://docs.feishu.cn/drive/folder/${folder.token}`;
        await bitable.updateRecord(client.id, { '飞书文件夹链接': folderUrl });
        client.folderLink = folderUrl;
      } catch (folderErr) {
        console.error('Failed to create folder:', folderErr.message);
        // Non-fatal: continue even if folder creation fails
      }
    }

    res.status(201).json(client);
  } catch (err) {
    console.error('Error creating client:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    if (!config.isConfigured()) {
      const idx = mockStore.findIndex(c => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Client not found' });
      mockStore[idx] = { ...mockStore[idx], ...req.body, id: req.params.id };
      return res.json(mockStore[idx]);
    }

    const fields = clientToFeishu(req.body);
    const record = await bitable.updateRecord(req.params.id, fields);
    res.json(feishuToClient(record));
  } catch (err) {
    console.error('Error updating client:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!config.isConfigured()) {
      const idx = mockStore.findIndex(c => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Client not found' });
      mockStore.splice(idx, 1);
      return res.json({ success: true });
    }

    await bitable.deleteRecord(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting client:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
