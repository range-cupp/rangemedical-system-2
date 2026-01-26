// pages/api/extension/version.js
// Returns current extension version info

export default function handler(req, res) {
  // Current version info - UPDATE THIS WHEN YOU RELEASE NEW VERSIONS
  const versionInfo = {
    version: '1.3.2',
    notes: 'Direct GHL lookup for appointments (no sync needed)',
    releaseDate: '2026-01-26',
    downloadUrl: 'https://app.range-medical.com/api/extension/download'
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(versionInfo);
}
