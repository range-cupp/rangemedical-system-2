import { useState } from 'react';

export default function ResearchModal({
  isOpen,
  onClose,
  study,
  servicePage
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !study) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/research/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studyId: study.id,
          studyTitle: study.headline,
          servicePage,
          category: study.category,
          tags: study.tags
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ firstName: '', lastName: '', email: '' });
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <>
      <div className="research-modal-overlay" onClick={handleClose} />
      <div className="research-modal">
        <button className="research-modal-close" onClick={handleClose} aria-label="Close">×</button>

        {isSuccess ? (
          <div className="research-modal-success">
            <div className="research-modal-success-icon">✓</div>
            <h3>Check Your Email</h3>
            <p>We've sent the research summary to <strong>{formData.email}</strong>. It should arrive within a few minutes.</p>
            <button className="research-modal-btn" onClick={handleClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="research-modal-header">
              <span className="research-modal-category">{study.category}</span>
              <h3>{study.headline}</h3>
              <p className="research-modal-source">{study.sourceJournal}, {study.sourceYear}</p>
            </div>

            <p className="research-modal-description">
              Enter your info below and we'll email you a detailed summary of this research — including what it means for you.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="research-modal-row">
                <div className="research-modal-field">
                  <label htmlFor="rm-firstName">First Name</label>
                  <input
                    type="text"
                    id="rm-firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div className="research-modal-field">
                  <label htmlFor="rm-lastName">Last Name</label>
                  <input
                    type="text"
                    id="rm-lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="research-modal-field">
                <label htmlFor="rm-email">Email</label>
                <input
                  type="email"
                  id="rm-email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="research-modal-error">{error}</p>}

              <button
                type="submit"
                className="research-modal-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Me the Research'}
              </button>

              <p className="research-modal-privacy">
                We respect your privacy. No spam, just the research you requested.
              </p>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .research-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .research-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 12px;
          padding: 2rem;
          max-width: 480px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          z-index: 1001;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .research-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #737373;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .research-modal-close:hover {
          background: #f5f5f5;
          color: #171717;
        }

        .research-modal-header {
          margin-bottom: 1.5rem;
          padding-right: 2rem;
        }

        .research-modal-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #fff;
          background: #171717;
          padding: 0.25rem 0.625rem;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .research-modal-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 0.5rem;
          line-height: 1.3;
        }

        .research-modal-source {
          font-size: 0.875rem;
          color: #737373;
          margin: 0;
        }

        .research-modal-description {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .research-modal-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .research-modal-field {
          margin-bottom: 1rem;
        }

        .research-modal-field label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .research-modal-field input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          box-sizing: border-box;
        }

        .research-modal-field input:focus {
          outline: none;
          border-color: #171717;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }

        .research-modal-field input::placeholder {
          color: #a3a3a3;
        }

        .research-modal-error {
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #fef2f2;
          border-radius: 6px;
        }

        .research-modal-btn {
          width: 100%;
          padding: 0.875rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          background: #171717;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .research-modal-btn:hover:not(:disabled) {
          background: #262626;
          transform: translateY(-1px);
        }

        .research-modal-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .research-modal-privacy {
          font-size: 0.75rem;
          color: #737373;
          text-align: center;
          margin: 1rem 0 0;
        }

        .research-modal-success {
          text-align: center;
          padding: 1rem 0;
        }

        .research-modal-success-icon {
          width: 64px;
          height: 64px;
          background: #22c55e;
          color: #fff;
          font-size: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .research-modal-success h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 0.75rem;
        }

        .research-modal-success p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
          margin: 0 0 1.5rem;
        }

        @media (max-width: 480px) {
          .research-modal {
            padding: 1.5rem;
          }

          .research-modal-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
