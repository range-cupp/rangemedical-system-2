// pages/api/extension/version.js
// Returns current extension version info

export default function handler(req, res) {
  // Current version info - UPDATE THIS WHEN YOU RELEASE NEW VERSIONS
  const versionInfo = {
    version: '1.4.0',
    notes: 'Fixed: Sex/Gender radio buttons + Date of Birth now auto-fill correctly',
    releaseDate: '2026-02-09',
    downloadUrl: 'https://app.range-medical.com/api/extension/download'
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(versionInfo);
}
