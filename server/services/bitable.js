const axios = require('axios');
const { getToken } = require('./feishuToken');
const config = require('../config');

function baseUrl() {
  return `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.FEISHU_APP_TOKEN}/tables/${config.FEISHU_TABLE_ID}`;
}

async function authHeaders() {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function getRecords() {
  const headers = await authHeaders();
  let allRecords = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const params = { page_size: 100 };
    if (pageToken) params.page_token = pageToken;

    const response = await axios.get(`${baseUrl()}/records`, { headers, params });

    if (response.data.code !== 0) {
      throw new Error(`Feishu bitable error: ${response.data.msg}`);
    }

    const items = response.data.data.items || [];
    allRecords = allRecords.concat(items);

    hasMore = response.data.data.has_more || false;
    pageToken = response.data.data.page_token || null;
  }

  return allRecords;
}

async function getRecord(recordId) {
  const headers = await authHeaders();
  const response = await axios.get(`${baseUrl()}/records/${recordId}`, { headers });

  if (response.data.code !== 0) {
    throw new Error(`Feishu bitable error: ${response.data.msg}`);
  }

  return response.data.data.record;
}

async function createRecord(fields) {
  const headers = await authHeaders();
  const response = await axios.post(
    `${baseUrl()}/records`,
    { fields },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`Feishu bitable error: ${response.data.msg}`);
  }

  return response.data.data.record;
}

async function updateRecord(recordId, fields) {
  const headers = await authHeaders();
  const response = await axios.put(
    `${baseUrl()}/records/${recordId}`,
    { fields },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`Feishu bitable error: ${response.data.msg}`);
  }

  return response.data.data.record;
}

async function deleteRecord(recordId) {
  const headers = await authHeaders();
  const response = await axios.delete(`${baseUrl()}/records/${recordId}`, { headers });

  if (response.data.code !== 0) {
    throw new Error(`Feishu bitable error: ${response.data.msg}`);
  }

  return response.data.data;
}

module.exports = { getRecords, getRecord, createRecord, updateRecord, deleteRecord };
