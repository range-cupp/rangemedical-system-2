import { useState } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { Upload, CheckCircle, Copy, Film } from 'lucide-react';

export default function UploadVSL() {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [results, setResults] = useState({ injury: null, energy: null });
  const [copied, setCopied] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file, type) => {
    if (!file) return;

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      alert('File too large. Max 500MB.');
      return;
    }

    setUploading(true);
    setUploadType(type);
    setProgress(0);

    try {
      const filename = `vsl/${type}-assessment.mp4`;

      const response = await fetch(`/api/upload-video?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await response.json();
      setResults(prev => ({ ...prev, [type]: data.url }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadType(null);
    }
  };

  const copyUrl = (url, type) => {
    navigator.clipboard.writeText(url);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AdminLayout title="Upload VSL Videos">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Assessment VSL Videos</h2>
          <p style={{ color: '#666', fontSize: 15 }}>
            Upload the two path-specific videos for the Range Assessment page.
            These play after a lead selects their path (Injury or Energy).
          </p>
        </div>

        {/* Injury VSL */}
        <div style={{
          ...sharedStyles.card,
          marginBottom: 24,
          border: results.injury ? '2px solid #22c55e' : '2px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Film size={20} color="#d97706" />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Injury & Recovery VSL</h3>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>60–90 second video for injury path leads</p>
            </div>
          </div>

          {results.injury ? (
            <div>
              <video
                src={results.injury}
                controls
                style={{ width: '100%', borderRadius: 8, marginBottom: 12, background: '#000' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => copyUrl(results.injury, 'injury')}
                  style={{
                    ...sharedStyles.buttonSecondary,
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
                  }}
                >
                  <Copy size={14} />
                  {copied === 'injury' ? 'Copied!' : 'Copy URL'}
                </button>
                <label style={{
                  ...sharedStyles.buttonSecondary,
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer'
                }}>
                  <Upload size={14} />
                  Replace
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/mov"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUpload(e.target.files[0], 'injury')}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '40px 20px', border: '2px dashed #d1d5db', borderRadius: 10,
              cursor: uploading && uploadType === 'injury' ? 'wait' : 'pointer',
              background: '#fafafa', transition: 'all 0.2s',
            }}>
              {uploading && uploadType === 'injury' ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>Uploading...</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>This may take a minute for large files</div>
                </>
              ) : (
                <>
                  <Upload size={28} color="#999" />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginTop: 8 }}>
                    Drop or click to upload
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>MP4 or MOV, max 500MB</div>
                </>
              )}
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/mov"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => handleUpload(e.target.files[0], 'injury')}
              />
            </label>
          )}
        </div>

        {/* Energy VSL */}
        <div style={{
          ...sharedStyles.card,
          marginBottom: 24,
          border: results.energy ? '2px solid #22c55e' : '2px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Film size={20} color="#2563eb" />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Energy & Optimization VSL</h3>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>60–90 second video for energy path leads</p>
            </div>
          </div>

          {results.energy ? (
            <div>
              <video
                src={results.energy}
                controls
                style={{ width: '100%', borderRadius: 8, marginBottom: 12, background: '#000' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => copyUrl(results.energy, 'energy')}
                  style={{
                    ...sharedStyles.buttonSecondary,
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
                  }}
                >
                  <Copy size={14} />
                  {copied === 'energy' ? 'Copied!' : 'Copy URL'}
                </button>
                <label style={{
                  ...sharedStyles.buttonSecondary,
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer'
                }}>
                  <Upload size={14} />
                  Replace
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/mov"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUpload(e.target.files[0], 'energy')}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '40px 20px', border: '2px dashed #d1d5db', borderRadius: 10,
              cursor: uploading && uploadType === 'energy' ? 'wait' : 'pointer',
              background: '#fafafa', transition: 'all 0.2s',
            }}>
              {uploading && uploadType === 'energy' ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>Uploading...</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>This may take a minute for large files</div>
                </>
              ) : (
                <>
                  <Upload size={28} color="#999" />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginTop: 8 }}>
                    Drop or click to upload
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>MP4 or MOV, max 500MB</div>
                </>
              )}
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/mov"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => handleUpload(e.target.files[0], 'energy')}
              />
            </label>
          )}
        </div>

        {/* Status summary */}
        {(results.injury || results.energy) && (
          <div style={{
            ...sharedStyles.card,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircle size={18} color="#22c55e" />
              <span style={{ fontWeight: 600, fontSize: 15 }}>Upload Status</span>
            </div>
            <div style={{ fontSize: 14, color: '#333' }}>
              <div style={{ marginBottom: 4 }}>
                Injury VSL: {results.injury ? '✓ Uploaded' : '– Not yet uploaded'}
              </div>
              <div>
                Energy VSL: {results.energy ? '✓ Uploaded' : '– Not yet uploaded'}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
