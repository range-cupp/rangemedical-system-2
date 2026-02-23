// pages/compare-labs.js
/*
 * Lab Comparison Page - Styled to match Range Medical intake form
 * 
 * IMPORTANT: Add this to pages/_app.js or pages/_document.js:
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 * <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { biomarkerGroups } from '../lib/biomarker-config';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CompareLabs() {
  const router = useRouter();
  const { ids } = router.query;
  
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ids) return;
    
    const labIds = ids.split(',');
    if (labIds.length !== 2) {
      setError('Please select exactly 2 labs to compare');
      setLoading(false);
      return;
    }
    
    fetchLabs(labIds);
  }, [ids]);

  const fetchLabs = async (labIds) => {
    try {
      setLoading(true);
      
      // Fetch both labs
      const { data, error } = await supabaseClient
        .from('labs')
        .select('*')
        .in('id', labIds)
        .order('test_date', { ascending: false });

      if (error) throw error;
      
      if (data.length !== 2) {
        setError('Could not find both labs');
        return;
      }

      setLabs(data);
    } catch (err) {
      console.error('Error fetching labs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  const getValueColor = (val1, val2) => {
    if (val1 === null || val2 === null) return '#666666';
    if (val1 === val2) return '#666666';
    if (val1 > val2) return '#16a34a'; // Green for increase
    return '#ef4444'; // Red for decrease
  };

  // biomarkerGroups imported from lib/biomarker-config.js

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Loading labs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const [lab1, lab2] = labs;

  return (
    <div style={{ 
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '2rem',
      maxWidth: '1600px',
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #000000'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          margin: '0 0 1rem 0',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: '#000000'
        }}>
          Lab Comparison
        </h1>
        <button
          onClick={() => window.close()}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#000000',
            color: '#ffffff',
            border: '2px solid #000000',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#262626'}
          onMouseLeave={(e) => e.target.style.background = '#000000'}
        >
          Close Window
        </button>
      </div>

      {/* Lab Headers */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {[lab1, lab2].map((lab, idx) => (
          <div key={lab.id} style={{ 
            padding: '1.5rem',
            background: '#f9f9f9',
            border: '2px solid #000000'
          }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: idx === 0 ? '#3b82f6' : '#16a34a'
            }}>
              Lab {idx + 1}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#404040' }}>
              <div><strong>Date:</strong> {formatDate(lab.test_date)}</div>
              <div><strong>Panel:</strong> {lab.panel_type}</div>
              <div><strong>Provider:</strong> {lab.lab_provider || 'N/A'}</div>
              {lab.notes && <div style={{ marginTop: '0.5rem' }}><strong>Notes:</strong> {lab.notes}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* PDFs if available */}
      {(lab1.lab_url || lab2.lab_url) && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700,
            marginBottom: '1rem',
            textTransform: 'uppercase'
          }}>
            PDF Reports
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2rem'
          }}>
            {[lab1, lab2].map((lab) => (
              <div key={lab.id}>
                {lab.lab_url ? (
                  <iframe
                    src={lab.lab_url}
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '2px solid #000000'
                    }}
                  />
                ) : (
                  <div style={{
                    height: '600px',
                    border: '2px solid #000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f9f9f9',
                    color: '#404040'
                  }}>
                    No PDF available
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biomarker Comparison */}
      <div>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 700,
          marginBottom: '1rem',
          textTransform: 'uppercase'
        }}>
          Biomarker Values
        </h2>

        {Object.entries(biomarkerGroups).map(([groupName, biomarkers]) => {
          // Check if any values exist in this group
          const hasValues = biomarkers.some(b => 
            lab1[b.key] !== null || lab2[b.key] !== null
          );

          if (!hasValues) return null;

          return (
            <div key={groupName} style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: 700,
                marginBottom: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#000000',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>
                {groupName}
              </h3>
              
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse',
                border: '2px solid #000000'
              }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'left',
                      borderBottom: '2px solid #000000',
                      fontWeight: 700,
                      fontSize: '0.8125rem', letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      Biomarker
                    </th>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      borderBottom: '2px solid #000000',
                      borderLeft: '1px solid #d1d5db',
                      fontWeight: 700,
                      fontSize: '0.8125rem', letterSpacing: '0.05em',
                      color: '#3b82f6'
                    }}>
                      Lab 1
                    </th>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      borderBottom: '2px solid #000000',
                      borderLeft: '1px solid #d1d5db',
                      fontWeight: 700,
                      fontSize: '0.8125rem', letterSpacing: '0.05em',
                      color: '#16a34a'
                    }}>
                      Lab 2
                    </th>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      borderBottom: '2px solid #000000',
                      borderLeft: '1px solid #d1d5db',
                      fontWeight: 700,
                      fontSize: '0.8125rem', letterSpacing: '0.05em'
                    }}>
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {biomarkers.map(biomarker => {
                    const val1 = lab1[biomarker.key];
                    const val2 = lab2[biomarker.key];
                    
                    // Skip if both values are null
                    if (val1 === null && val2 === null) return null;

                    const change = (val1 !== null && val2 !== null) 
                      ? ((val2 - val1) / val1 * 100).toFixed(1) 
                      : null;

                    const changeColor = change !== null
                      ? (change > 0 ? '#16a34a' : change < 0 ? '#ef4444' : '#666666')
                      : '#666666';

                    return (
                      <tr key={biomarker.key} style={{ 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <td style={{ padding: '0.75rem' }}>
                          {biomarker.label}
                          <span style={{ 
                            marginLeft: '0.5rem', 
                            color: '#404040', 
                            fontSize: '0.8125rem', letterSpacing: '0.05em' 
                          }}>
                            ({biomarker.unit})
                          </span>
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          borderLeft: '1px solid #e5e7eb',
                          fontWeight: 600,
                          color: val1 !== null ? '#3b82f6' : '#404040'
                        }}>
                          {formatValue(val1)}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          borderLeft: '1px solid #e5e7eb',
                          fontWeight: 600,
                          color: val2 !== null ? '#16a34a' : '#404040'
                        }}>
                          {formatValue(val2)}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          borderLeft: '1px solid #e5e7eb',
                          fontWeight: 700,
                          color: changeColor
                        }}>
                          {change !== null ? (
                            <>
                              {change > 0 ? '↑' : change < 0 ? '↓' : '='} {Math.abs(change)}%
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
