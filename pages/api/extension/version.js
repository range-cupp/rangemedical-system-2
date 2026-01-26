// pages/api/extension/version.js
// Returns current extension version info

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Current version info - UPDATE THIS WHEN YOU RELEASE NEW VERSIONS
  const versionInfo = {
    version: '1.2.5',
    notes: 'Documents inline + Photo ID support',
    releaseDate: '2026-01-26',
    downloadUrl: 'https://app.range-medical.com/api/extension/download'
  };
  
  res.status(200).json(versionInfo);
}
