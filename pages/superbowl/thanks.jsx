// /pages/superbowl/thanks.jsx
// Range Medical Super Bowl LX Giveaway - Thank You Page
// Created: 2026-02-08

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function SuperBowlThanks() {
  const [teamPick, setTeamPick] = useState('');
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const storedTeam = sessionStorage.getItem('sbTeamPick');
    const storedName = sessionStorage.getItem('sbFirstName');
    if (storedTeam) setTeamPick(storedTeam);
    if (storedName) setFirstName(storedName);
  }, []);

  const getTeamName = (team) => {
    if (team === 'patriots') return 'New England Patriots';
    if (team === 'seahawks') return 'Seattle Seahawks';
    return '';
  };

  const getTeamEmoji = (team) => {
    if (team === 'patriots') return '🔴🔵';
    if (team === 'seahawks') return '🟢💙';
    return '🏈';
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
        <div className="thanks-content">
          <div className="thanks-logo">RANGE MEDICAL</div>

          <div className="thanks-check">✓</div>

          <h1>You're In{firstName ? `, ${firstName}` : ''}!</h1>

          <p className="thanks-subtitle">
            Your entry has been submitted. We'll text you after the game if you're our winner!
          </p>

          {teamPick && (
            <div className="thanks-pick">
              <span className="thanks-pick-label">Your Pick:</span>
              <div className="thanks-team">
                <span className="thanks-team-emoji">{getTeamEmoji(teamPick)}</span>
                <span className="thanks-team-name">{getTeamName(teamPick)}</span>
              </div>
            </div>
          )}

          <div className="thanks-reminder">
            <span className="thanks-reminder-icon">📱</span>
            <span>Keep an eye on your phone after the game.</span>
          </div>

          <div className="thanks-social">
            <p>Follow us on Instagram for the winner announcement</p>
            <a
              href="https://instagram.com/range_medical"
              target="_blank"
              rel="noopener noreferrer"
              className="thanks-ig-btn"
            >
              @range_medical
            </a>
          </div>

          <div className="thanks-divider"></div>

          <div className="thanks-contact">
            <p className="thanks-brand">Range Medical</p>
            <p className="thanks-address">Newport Beach, CA</p>
            <a href="tel:9499973988" className="thanks-phone">(949) 997-3988</a>
          </div>

          <Link href="/" className="thanks-home">
            Visit Range Medical →
          </Link>
        </div>
      </div>

      <style jsx>{`
        .thanks-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
        }

        .thanks-content {
          max-width: 400px;
          text-align: center;
        }

        .thanks-logo {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
        }

        .thanks-check {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #00d4aa 0%, #00a88a 100%);
          color: #0f0f1a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 212, 170, 0.3);
        }

        .thanks-content h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.75rem;
        }

        .thanks-subtitle {
          font-size: 1rem;
          color: #a0a0b0;
          line-height: 1.6;
          margin: 0 0 2rem;
        }

        .thanks-pick {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .thanks-pick-label {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #707080;
          margin-bottom: 0.75rem;
        }

        .thanks-team {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .thanks-team-emoji {
          font-size: 1.5rem;
        }

        .thanks-team-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
        }

        .thanks-reminder {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(0, 212, 170, 0.1);
          border: 1px solid rgba(0, 212, 170, 0.2);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 2rem;
          font-size: 0.9375rem;
          color: #00d4aa;
        }

        .thanks-reminder-icon {
          font-size: 1.25rem;
        }

        .thanks-social {
          margin-bottom: 2rem;
        }

        .thanks-social p {
          font-size: 0.875rem;
          color: #808090;
          margin: 0 0 0.75rem;
        }

        .thanks-ig-btn {
          display: inline-block;
          background: linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%);
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .thanks-ig-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(225, 48, 108, 0.3);
        }

        .thanks-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 2rem 0;
        }

        .thanks-contact {
          margin-bottom: 1.5rem;
        }

        .thanks-brand {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.25rem;
        }

        .thanks-address {
          font-size: 0.875rem;
          color: #808090;
          margin: 0 0 0.5rem;
        }

        .thanks-phone {
          color: #00d4aa;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
        }

        .thanks-home {
          display: inline-block;
          color: #808090;
          font-size: 0.875rem;
          text-decoration: none;
          transition: color 0.2s;
        }

        .thanks-home:hover {
          color: #00d4aa;
        }
      `}</style>
    </>
  );
}
