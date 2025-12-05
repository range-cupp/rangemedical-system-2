// pages/compare-labs.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

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
    if (val1 > val2) return '#10b981'; // Green for increase
    return '#ef4444'; // Red for decrease
  };

  // Biomarker groups
  const biomarkerGroups = {
    'Hormones': [
      { key: 'total_testosterone', label: 'Total Testosterone', unit: 'ng/dL' },
      { key: 'free_testosterone', label: 'Free Testosterone', unit: 'pg/mL' },
      { key: 'shbg', label: 'SHBG', unit: 'nmol/L' },
      { key: 'estradiol', label: 'Estradiol', unit: 'pg/mL' },
      { key: 'progesterone', label: 'Progesterone', unit: 'ng/mL' },
      { key: 'dhea_s', label: 'DHEA-S', unit: 'µg/dL' },
      { key: 'dht', label: 'DHT', unit: 'ng/dL' },
      { key: 'fsh', label: 'FSH', unit: 'mIU/mL' },
      { key: 'lh', label: 'LH', unit: 'mIU/mL' },
      { key: 'igf_1', label: 'IGF-1', unit: 'ng/mL' },
      { key: 'cortisol', label: 'Cortisol', unit: 'µg/dL' }
    ],
    'Thyroid': [
      { key: 'tsh', label: 'TSH', unit: 'uIU/mL' },
      { key: 'free_t3', label: 'Free T3', unit: 'pg/mL' },
      { key: 'free_t4', label: 'Free T4', unit: 'ng/dL' },
      { key: 'tpo_antibody', label: 'TPO Antibody', unit: 'IU/mL' },
      { key: 'thyroglobulin_antibody', label: 'Thyroglobulin Antibody', unit: 'IU/mL' }
    ],
    'Blood Sugar & Metabolism': [
      { key: 'glucose', label: 'Glucose', unit: 'mg/dL' },
      { key: 'fasting_insulin', label: 'Fasting Insulin', unit: 'µIU/mL' },
      { key: 'hemoglobin_a1c', label: 'Hemoglobin A1C', unit: '%' },
      { key: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL' }
    ],
    'Lipids': [
      { key: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL' },
      { key: 'ldl_cholesterol', label: 'LDL', unit: 'mg/dL' },
      { key: 'hdl_cholesterol', label: 'HDL', unit: 'mg/dL' },
      { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL' },
      { key: 'vldl_cholesterol', label: 'VLDL', unit: 'mg/dL' }
    ],
    'Vitamins & Minerals': [
      { key: 'vitamin_d', label: 'Vitamin D', unit: 'ng/mL' },
      { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'pg/mL' },
      { key: 'folate', label: 'Folate', unit: 'ng/mL' },
      { key: 'magnesium', label: 'Magnesium', unit: 'mg/dL' }
    ],
    'Inflammation': [
      { key: 'crp_hs', label: 'CRP (hs)', unit: 'mg/L' },
      { key: 'esr', label: 'ESR', unit: 'mm/hr' },
      { key: 'homocysteine', label: 'Homocysteine', unit: 'µmol/L' }
    ],
    'Liver Function': [
      { key: 'alt', label: 'ALT', unit: 'U/L' },
      { key: 'ast', label: 'AST', unit: 'U/L' },
      { key: 'alkaline_phosphatase', label: 'Alkaline Phosphatase', unit: 'U/L' },
      { key: 'total_bilirubin', label: 'Total Bilirubin', unit: 'mg/dL' },
      { key: 'albumin', label: 'Albumin', unit: 'g/dL' },
      { key: 'total_protein', label: 'Total Protein', unit: 'g/dL' },
      { key: 'ggt', label: 'GGT', unit: 'U/L' }
    ],
    'Kidney Function': [
      { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL' },
      { key: 'bun', label: 'BUN', unit: 'mg/dL' },
      { key: 'egfr', label: 'eGFR', unit: 'mL/min/1.73m²' },
      { key: 'bun_creatinine_ratio', label: 'BUN/Creatinine Ratio', unit: '' }
    ],
    'Electrolytes': [
      { key: 'sodium', label: 'Sodium', unit: 'mmol/L' },
      { key: 'potassium', label: 'Potassium', unit: 'mmol/L' },
      { key: 'chloride', label: 'Chloride', unit: 'mmol/L' },
      { key: 'co2', label: 'CO2', unit: 'mmol/L' },
      { key: 'calcium', label: 'Calcium', unit: 'mg/dL' }
    ],
    'Complete Blood Count': [
      { key: 'wbc', label: 'WBC', unit: 'K/µL' },
      { key: 'rbc', label: 'RBC', unit: 'M/µL' },
      { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
      { key: 'hematocrit', label: 'Hematocrit', unit: '%' },
      { key: 'mcv', label: 'MCV', unit: 'fL' },
      { key: 'mch', label: 'MCH', unit: 'pg' },
      { key: 'mchc', label: 'MCHC', unit: 'g/dL' },
      { key: 'rdw', label: 'RDW', unit: '%' },
      { key: 'platelets', label: 'Platelets', unit: 'K/µL' }
    ],
    'Iron Studies': [
      { key: 'iron', label: 'Iron', unit: 'µg/dL' },
      { key: 'tibc', label: 'TIBC', unit: 'µg/dL' },
      { key: 'iron_saturation', label: 'Iron Saturation', unit: '%' },
      { key: 'ferritin', label: 'Ferritin', unit: 'ng/mL' }
    ],
    'Prostate': [
      { key: 'psa_total', label: 'PSA Total', unit: 'ng/mL' },
      { key: 'psa_free', label: 'PSA Free', unit: 'ng/mL' }
    ]
  };

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
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '3px solid #000000'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          margin: '0 0 0.5rem 0',
          textTransform: 'uppercase'
        }}>
          Lab Comparison
        </h1>
        <button
          onClick={() => window.close()}
          style={{
            padding: '0.5rem 1rem',
            background: '#000000',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            textTransform: 'uppercase'
          }}
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
              color: idx === 0 ? '#3b82f6' : '#10b981'
            }}>
              Lab {idx + 1}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
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
                    color: '#666'
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
                      fontSize: '0.85rem',
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
                      fontSize: '0.85rem',
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
                      fontSize: '0.85rem',
                      color: '#10b981'
                    }}>
                      Lab 2
                    </th>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      borderBottom: '2px solid #000000',
                      borderLeft: '1px solid #d1d5db',
                      fontWeight: 700,
                      fontSize: '0.85rem'
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
                      ? (change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#666666')
                      : '#666666';

                    return (
                      <tr key={biomarker.key} style={{ 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <td style={{ padding: '0.75rem' }}>
                          {biomarker.label}
                          <span style={{ 
                            marginLeft: '0.5rem', 
                            color: '#666', 
                            fontSize: '0.85rem' 
                          }}>
                            ({biomarker.unit})
                          </span>
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          borderLeft: '1px solid #e5e7eb',
                          fontWeight: 600,
                          color: val1 !== null ? '#3b82f6' : '#666'
                        }}>
                          {formatValue(val1)}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          borderLeft: '1px solid #e5e7eb',
                          fontWeight: 600,
                          color: val2 !== null ? '#10b981' : '#666'
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
