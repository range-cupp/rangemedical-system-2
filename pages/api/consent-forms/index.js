// pages/consent-forms.js
// Standalone Consent Forms page for Range Medical

import React from 'react';
import Link from 'next/link';

export default function ConsentFormsPage() {
  const consentForms = [
    {
      id: 'peptide-consent',
      title: 'Peptide Therapy & Injection Consent',
      description: 'Patient consent form for peptide therapy treatments',
      url: 'https://range-medical.com/peptide-therapy-consent-page',
      icon: '💉',
      status: 'active',
      color: '#16a34a'
    },
    {
      id: 'medical-intake',
      title: 'Medical Intake Form',
      description: 'New patient medical history and intake questionnaire',
      url: 'https://rangemedical-system-2.vercel.app/intake.html',
      icon: '📄',
      status: 'active',
      color: '#3b82f6'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '2px solid #000000',
        padding: '1.5rem 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: 0,
              color: '#000000'
            }}>
              RANGE MEDICAL
            </h1>
            <p style={{
              margin: '0.25rem 0 0 0',
              color: '#737373',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Consent Forms Management
            </p>
          </div>
          <Link href="/">
            <a style={{
              padding: '0.75rem 1.5rem',
              background: '#000000',
              color: '#ffffff',
              border: '2px solid #000000',
              fontSize: '0.875rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#000000';
              e.currentTarget.style.color = '#ffffff';
            }}>
              ← Back to Dashboard
            </a>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        padding: '3rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Page Title */}
        <div style={{
          marginBottom: '2.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem',
            color: '#000000'
          }}>
            CONSENT FORMS
          </h2>
          <p style={{
            color: '#737373',
            fontSize: '0.9375rem',
            lineHeight: '1.6'
          }}>
            Patient consent and intake forms for Range Medical. Click any form to open it in a new tab.
          </p>
        </div>

        {/* Forms Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {consentForms.map((form) => (
            <a
              key={form.id}
              href={form.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#ffffff',
                border: '2px solid #000000',
                padding: '2rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: '3rem',
                marginBottom: '1.25rem'
              }}>
                {form.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem',
                color: '#000000',
                lineHeight: '1.3'
              }}>
                {form.title}
              </h3>

              {/* Description */}
              <p style={{
                color: '#737373',
                fontSize: '0.9375rem',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                {form.description}
              </p>

              {/* Status Badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.375rem 1rem',
                background: form.status === 'active' ? '#f0fdf4' : '#fafafa',
                border: `1.5px solid ${form.color}`,
                color: form.color,
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1.25rem'
              }}>
                {form.status}
              </div>

              {/* Open Link */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#000000',
                fontSize: '0.9375rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '1rem'
              }}>
                <span>Open Form</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Instructions Card */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #e5e5e5',
          padding: '2rem'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1.25rem',
            color: '#000000'
          }}>
            📋 Instructions for Staff
          </h4>
          
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'start'
            }}>
              <div style={{
                background: '#000000',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <p style={{
                  margin: 0,
                  color: '#737373',
                  fontSize: '0.9375rem',
                  lineHeight: '1.6'
                }}>
                  <strong style={{ color: '#000000' }}>Access Forms:</strong> Click any form card above to open it in a new tab
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'start'
            }}>
              <div style={{
                background: '#000000',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                2
              </div>
              <div>
                <p style={{
                  margin: 0,
                  color: '#737373',
                  fontSize: '0.9375rem',
                  lineHeight: '1.6'
                }}>
                  <strong style={{ color: '#000000' }}>Share with Patients:</strong> Copy the form URL from your browser and send it directly to patients via email or text
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'start'
            }}>
              <div style={{
                background: '#000000',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                3
              </div>
              <div>
                <p style={{
                  margin: 0,
                  color: '#737373',
                  fontSize: '0.9375rem',
                  lineHeight: '1.6'
                }}>
                  <strong style={{ color: '#000000' }}>Automatic Syncing:</strong> All form submissions automatically sync to GoHighLevel and the Range Medical database
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'start'
            }}>
              <div style={{
                background: '#000000',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                4
              </div>
              <div>
                <p style={{
                  margin: 0,
                  color: '#737373',
                  fontSize: '0.9375rem',
                  lineHeight: '1.6'
                }}>
                  <strong style={{ color: '#000000' }}>Document Storage:</strong> PDFs are automatically emailed to cupp@range-medical.com and stored in Supabase for permanent access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: '#fafafa',
          border: '1.5px solid #e5e5e5'
        }}>
          <h5 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
            color: '#404040'
          }}>
            Quick Links
          </h5>
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <a
              href="https://range-medical.com/peptide-therapy-consent-page"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                background: '#ffffff',
                border: '1.5px solid #e5e5e5',
                color: '#737373',
                fontSize: '0.8125rem',
                fontWeight: '600',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#000000';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e5e5';
                e.currentTarget.style.color = '#737373';
              }}
            >
              Peptide Consent →
            </a>
            <a
              href="https://rangemedical-system-2.vercel.app/intake.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                background: '#ffffff',
                border: '1.5px solid #e5e5e5',
                color: '#737373',
                fontSize: '0.8125rem',
                fontWeight: '600',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#000000';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e5e5';
                e.currentTarget.style.color = '#737373';
              }}
            >
              Medical Intake →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
