import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img 
            src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
            alt="Range Medical" 
          />
          <p>Upstairs from Range Sports Therapy.<br/>Newport Beach, California.</p>
          <a href="tel:+19499973988" className="footer-contact">(949) 997-3988</a>
        </div>
        
        <div className="footer-col">
          <h4>Get Started</h4>
          <ul>
            <li><Link href="/range-assessment">Range Assessment</Link></li>
            <li><Link href="/injury-recovery">Injury & Recovery</Link></li>
            <li><Link href="/lab-panels">Labs & Testing</Link></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>How We Treat</h4>
          <ul>
            <li><Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link></li>
            <li><Link href="/red-light-therapy">Red Light Therapy</Link></li>
            <li><Link href="/peptide-therapy">Peptide Therapy</Link></li>
            <li><Link href="/nad-therapy">NAD+ Therapy</Link></li>
            <li><Link href="/iv-therapy">IV Therapy</Link></li>
            <li><Link href="/hormone-optimization">Hormone Optimization</Link></li>
            <li><Link href="/weight-loss">Weight Loss</Link></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>Info</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/gift-cards">Gift Cards</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 Range Medical. All rights reserved.</p>
        <div className="footer-legal">
          <Link href="/terms-of-use">Terms</Link>
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/refund-policy">Refunds</Link>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #ffffff;
          border-top: 1px solid #e5e5e5;
          padding: 3rem 1.5rem 2rem;
        }
        
        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
        }
        
        .footer-brand img {
          height: 40px;
          margin-bottom: 1rem;
        }
        
        .footer-brand p {
          font-size: 0.875rem;
          color: #525252;
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        
        .footer-contact {
          font-size: 0.9rem;
          color: #000000;
          text-decoration: none;
          font-weight: 600;
        }
        
        .footer-col h4 {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 1rem;
          color: #737373;
        }
        
        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-col li {
          margin-bottom: 0.625rem;
        }
        
        .footer-col :global(a) {
          color: #404040;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        
        .footer-col :global(a:hover) {
          color: #000000;
        }
        
        .footer-bottom {
          max-width: 1200px;
          margin: 2rem auto 0;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e5e5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .footer-bottom p {
          font-size: 0.8125rem;
          color: #737373;
          margin: 0;
        }
        
        .footer-legal {
          display: flex;
          gap: 1.5rem;
        }
        
        .footer-legal :global(a) {
          font-size: 0.8125rem;
          color: #737373;
          text-decoration: none;
        }
        
        .footer-legal :global(a:hover) {
          color: #000000;
        }
        
        @media (max-width: 900px) {
          .footer-inner {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @media (max-width: 640px) {
          .footer-inner {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
