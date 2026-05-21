const axios = require('axios');
const { getToken } = require('./feishuToken');

async function authHeaders() {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function createFolder(name, parentToken) {
  const headers = await authHeaders();
  const response = await axios.post(
    'https://open.feishu.cn/open-apis/drive/v1/files/create_folder',
    {
      name,
      folder_token: parentToken
    },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`Failed to create folder: ${response.data.msg}`);
  }

  return response.data.data;
}

async function createDocument(title, folderToken) {
  const headers = await authHeaders();
  const response = await axios.post(
    'https://open.feishu.cn/open-apis/docx/v1/documents',
    {
      title,
      folder_token: folderToken
    },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`Failed to create document: ${response.data.msg}`);
  }

  return response.data.data;
}

async function getFileList(folderToken) {
  const headers = await authHeaders();
  const response = await axios.get(
    'https://open.feishu.cn/open-apis/drive/v1/files',
    {
      headers,
      params: {
        folder_token: folderToken,
        page_size: 50
      }
    }
  );

  if (response.data.code !== 0) {
    throw new Error(`Failed to list files: ${response.data.msg}`);
  }

  return response.data.data.files || [];
}

module.exports = { createFolder, createDocument, getFileList };
