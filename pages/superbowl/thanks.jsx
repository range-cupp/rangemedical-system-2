// /pages/superbowl/thanks.jsx
// Range Medical Super Bowl LX Giveaway - Thank You Page
// Created: 2026-02-08

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function SuperBowlThanks() {
  const [teamPick, setTeamPick] = useState('');
  const [firstName, setFirstName] = useState('');
  const [referredBy, setReferredBy] = useState('');

  useEffect(() => {
    const storedTeam = sessionStorage.getItem('sbTeamPick');
    const storedName = sessionStorage.getItem('sbFirstName');
    const storedReferrer = sessionStorage.getItem('sbReferredBy');
    if (storedTeam) setTeamPick(storedTeam);
    if (storedName) setFirstName(storedName);
    if (storedReferrer) setReferredBy(storedReferrer);
  }, []);

  const getTeamName = (team) => {
    if (team === 'patriots') return 'New England Patriots';
    if (team === 'seahawks') return 'Seattle Seahawks';
    return '';
  };

  return (
    <>
      <Head>
        <title>You're In! | Super Bowl LX Giveaway | Range Medical</title>
        <meta name="description" content="Your entry has been submitted for the Range Medical Super Bowl LX Giveaway." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="thanks-page">
        {/* Header */}
        <header className="thanks-header">
          <Link href="/" className="thanks-logo">RANGE MEDICAL</Link>
        </header>

        <div className="thanks-content">
          <div className="thanks-check">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <h1>You're In{firstName ? `, ${firstName}` : ''}!</h1>

          <p className="thanks-subtitle">
            Your entry has been submitted. We'll text you after the game if you're our winner!
          </p>

          {teamPick && (
            <div className="thanks-pick">
              <span className="thanks-pick-label">Your Pick</span>
              <div className="thanks-team">
                <div className="thanks-team-colors">
                  {teamPick === 'patriots' ? (
                    <>
                      <span className="thanks-dot thanks-red"></span>
                      <span className="thanks-dot thanks-blue"></span>
                    </>
                  ) : (
                    <>
                      <span className="thanks-dot thanks-green"></span>
                      <span className="thanks-dot thanks-navy"></span>
                    </>
                  )}
                </div>
                <span className="thanks-team-name">{getTeamName(teamPick)}</span>
              </div>
            </div>
          )}

          {referredBy && (
            <div className="thanks-referrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>If you win, <strong>{referredBy}</strong> wins too!</span>
            </div>
          )}

          <div className="thanks-reminder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Keep an eye on your phone after the game.</span>
          </div>

          <div className="thanks-divider"></div>

          <div className="thanks-social">
            <p>Follow us on Instagram for the winner announcement</p>
            <a
              href="https://instagram.com/range_medical"
              target="_blank"
              rel="noopener noreferrer"
              className="thanks-ig-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @range_medical
            </a>
          </div>

          <div className="thanks-divider"></div>

          <div className="thanks-contact">
            <p className="thanks-brand">Range Medical</p>
            <p className="thanks-address">1901 Westcliff Dr, Suite 10 · Newport Beach, CA</p>
            <a href="tel:9499973988" className="thanks-phone">(949) 997-3988</a>
          </div>

          <Link href="/" className="thanks-home">
            Visit Range Medical
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .thanks-page {
          min-height: 100vh;
          background: #ffffff;
          color: #171717;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .thanks-header {
          padding: 1.25rem 1.5rem;
          text-align: center;
          border-bottom: 1px solid #e5e5e5;
        }

        .thanks-logo {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #171717;
          text-decoration: none;
        }

        .thanks-content {
          max-width: 420px;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
          text-align: center;
        }

        .thanks-check {
          width: 64px;
          height: 64px;
          background: #22c55e;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .thanks-content h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.75rem;
          color: #171717;
        }

        .thanks-subtitle {
          font-size: 1rem;
          color: #525252;
          line-height: 1.6;
          margin: 0 0 2rem;
        }

        .thanks-pick {
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }

        .thanks-pick-label {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        .thanks-team {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .thanks-team-colors {
          display: flex;
          gap: 0.25rem;
        }

        .thanks-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .thanks-red { background: #c8102e; }
        .thanks-blue { background: #002244; }
        .thanks-green { background: #69be28; }
        .thanks-navy { background: #002244; }

        .thanks-team-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #171717;
        }

        .thanks-referrer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 0.875rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.9375rem;
          color: #525252;
        }

        .thanks-referrer svg {
          color: #737373;
          flex-shrink: 0;
        }

        .thanks-referrer strong {
          color: #171717;
        }

        .thanks-reminder {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 2rem;
          font-size: 0.9375rem;
          color: #166534;
        }

        .thanks-reminder svg {
          flex-shrink: 0;
        }

        .thanks-divider {
          height: 1px;
          background: #e5e5e5;
          margin: 0 0 2rem;
        }

        .thanks-social {
          margin-bottom: 2rem;
        }

        .thanks-social p {
          font-size: 0.875rem;
          color: #737373;
          margin: 0 0 0.75rem;
        }

        .thanks-ig-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%);
          color: #ffffff;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .thanks-ig-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(225, 48, 108, 0.25);
        }

        .thanks-contact {
          margin-bottom: 2rem;
        }

        .thanks-brand {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.25rem;
        }

        .thanks-address {
          font-size: 0.875rem;
          color: #737373;
          margin: 0 0 0.5rem;
        }

        .thanks-phone {
          color: #171717;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
        }

        .thanks-phone:hover {
          color: #525252;
        }

        .thanks-home {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #737373;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }

        .thanks-home:hover {
          color: #171717;
        }

        @media (max-width: 480px) {
          .thanks-content h1 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </>
  );
}
