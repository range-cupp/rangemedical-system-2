// pages/api/extension/download.js
// Serves the extension zip file for download

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const filePath = path.join(process.cwd(), 'public', 'extension', 'range-pf-extension.zip');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Extension file not found' });
  }
  
  // Read and serve the file
  const file = fs.readFileSync(filePath);
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=range-pf-extension.zip');
  res.setHeader('Content-Length', file.length);
  
  res.send(file);
}
