const express = require('express');
const router = express.Router();
const drive = require('../services/drive');
const bitable = require('../services/bitable');
const config = require('../config');

const DOC_TEMPLATES = [
  '01-健康档案',
  '02-基础检测报告解读',
  '03-个性化干预方案',
  '04-饮食调理计划',
  '05-营养素补充方案',
  '06-生活方式建议',
  '07-运动康复计划',
  '08-压力管理方案',
  '09-3个月复查报告',
  '10-6个月复查报告',
  '11-阶段性总结与调整'
];

// POST /api/docs/setup/:clientId - create folder + 11 blank docs for client
router.post('/setup/:clientId', async (req, res) => {
  try {
    if (!config.isConfigured()) {
      // Mock mode - return fake doc structure
      const mockDocs = DOC_TEMPLATES.map((title, i) => ({
        title,
        document_id: `mock_doc_${req.params.clientId}_${i + 1}`,
        url: ''
      }));
      return res.json({
        folder: { token: 'mock_folder', url: '' },
        documents: mockDocs
      });
    }

    // Get client info for folder name
    let clientName = req.params.clientId;
    try {
      const record = await bitable.getRecord(req.params.clientId);
      clientName = record.fields['客户姓名'] || req.params.clientId;
    } catch (e) {
      // Use ID as fallback
    }

    // Create client folder
    const folderData = await drive.createFolder(
      `${clientName}-${req.params.clientId}`,
      config.FEISHU_ROOT_FOLDER_TOKEN
    );
    const folderToken = folderData.token;
    const folderUrl = `https://docs.feishu.cn/drive/folder/${folderToken}`;

    // Create all 11 documents
    const documents = [];
    for (const title of DOC_TEMPLATES) {
      try {
        const doc = await drive.createDocument(title, folderToken);
        documents.push({
          title,
          document_id: doc.document.document_id,
          url: `https://docs.feishu.cn/docx/${doc.document.document_id}`
        });
      } catch (docErr) {
        console.error(`Failed to create doc "${title}":`, docErr.message);
        documents.push({ title, document_id: null, url: null, error: docErr.message });
      }
    }

    // Update client record with folder link
    try {
      await bitable.updateRecord(req.params.clientId, { '飞书文件夹链接': folderUrl });
    } catch (updateErr) {
      console.error('Failed to update folder link:', updateErr.message);
    }

    res.json({ folder: { token: folderToken, url: folderUrl }, documents });
  } catch (err) {
    console.error('Error setting up docs:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/docs/:clientId - list documents for client
router.get('/:clientId', async (req, res) => {
  try {
    if (!config.isConfigured()) {
      const mockDocs = DOC_TEMPLATES.map((title, i) => ({
        title,
        name: title,
        type: 'docx',
        token: `mock_doc_${req.params.clientId}_${i + 1}`,
        url: ''
      }));
      return res.json(mockDocs);
    }

    // Get folder token from client record
    const record = await bitable.getRecord(req.params.clientId);
    const folderLink = record.fields['飞书文件夹链接'];

    if (!folderLink) {
      return res.json([]);
    }

    // Extract folder token from URL
    const folderToken = folderLink.split('/').pop();
    const files = await drive.getFileList(folderToken);
    res.json(files);
  } catch (err) {
    console.error('Error listing docs:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
