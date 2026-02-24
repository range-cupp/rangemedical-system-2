// pages/api/extension/version.js
// Returns current extension version info

export default function handler(req, res) {
  const versionInfo = {
    version: '1.4.1',
    notes: 'Fix: Sex, DOB, and State now fill correctly. Documents download directly.',
    releaseDate: '2026-02-24',
    downloadUrl: 'https://app.range-medical.com/api/extension/download'
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(versionInfo);
}
