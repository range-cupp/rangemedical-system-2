// pages/giveaway/thanks.jsx
// "You're in" confirmation page for the 6-Week Cellular Energy Reset giveaway

import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';

export default function GiveawayThanksPage() {
  return (
    <Layout
      title="You're entered | Range Medical Giveaway"
      description="You're entered to win a 6-Week Cellular Energy Reset at Range Medical."
    >
      <Head>
        <style>{`
          .gv-thx-page { color: #171717; }
          .gv-thx-wrap {
            max-width: 640px;
            margin: 0 auto;
            padding: 6rem 2rem 6rem;
          }
          .gv-thx-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #16A34A;
            margin: 0 0 14px;
          }
          .gv-thx-wrap h1 {
            font-size: clamp(2.25rem, 5vw, 3.25rem);
            font-weight: 900;
            line-height: 1;
            margin: 0 0 20px;
            letter-spacing: -0.02em;
            text-transform: uppercase;
          }
          .gv-thx-rule {
            width: 100%;
            height: 1px;
            background: #e0e0e0;
            margin: 20px 0 24px;
          }
          .gv-thx-wrap p {
            font-size: 17px;
            color: #404040;
            line-height: 1.6;
            margin: 0 0 16px;
          }
          .gv-thx-steps {
            background: #fafafa;
            border-left: 3px solid #171717;
            padding: 20px 24px;
            margin: 28px 0;
          }
          .gv-thx-steps h3 {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            margin: 0 0 12px;
            color: #171717;
          }
          .gv-thx-steps ol {
            margin: 0;
            padding: 0 0 0 20px;
            color: #404040;
            font-size: 15px;
            line-height: 1.7;
          }
          .gv-thx-steps li { margin-bottom: 6px; }
          .gv-thx-cta {
            display: inline-block;
            margin-top: 16px;
            padding: 16px 28px;
            background: #171717;
            color: #fff;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }
          .gv-thx-cta:hover { background: #404040; }
        `}</style>
      </Head>

      <div className="gv-thx-page">
        <div className="gv-thx-wrap">
          <p className="gv-thx-eyebrow">✓ You&apos;re in</p>
          <h1>You&apos;re entered.</h1>
          <div className="gv-thx-rule" />

          <p>
            You&apos;re officially entered to win the 6-Week Cellular Energy Reset
            at Range Medical. We just sent a confirmation text to the number
            you gave us.
          </p>

          <div className="gv-thx-steps">
            <h3>What happens next</h3>
            <ol>
              <li>
                <strong>Saturday, April 25 at 10 AM PT:</strong> we pick the winner
                at random and text them directly.
              </li>
              <li>
                Everyone else who qualifies will get a <strong>$1,000 scholarship</strong> text — $2,999
                dropped to $1,999 on the same program, good for 7 days.
              </li>
              <li>Watch for a text from us — reply so your carrier doesn&apos;t filter future messages.</li>
            </ol>
          </div>

          <p>
            Want to learn more about the program while you wait?
          </p>
          <Link href="/" className="gv-thx-cta">Explore Range Medical</Link>
        </div>
      </div>
    </Layout>
  );
}
