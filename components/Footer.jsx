import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="rm-footer">
      <div className="rm-footer-inner">
        <div className="rm-footer-brand">
          <img 
            src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
            alt="Range Medical" 
          />
          <p>Upstairs from Range Sports Therapy.<br/>Newport Beach, California.</p>
          <a href="tel:+19499973988" className="rm-footer-contact">(949) 997-3988</a>
        </div>
        
        <div className="rm-footer-col">
          <h4>Get Started</h4>
          <ul>
            <li><Link href="/range-assessment">Range Assessment</Link></li>
            <li><Link href="/injury-recovery">Injury & Recovery</Link></li>
            <li><Link href="/lab-panels">Labs & Testing</Link></li>
          </ul>
        </div>
        
        <div className="rm-footer-col">
          <h4>How We Treat</h4>
          <ul>
            <li><Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link></li>
            <li><Link href="/red-light-therapy">Red Light Therapy</Link></li>
            <li><Link href="/peptide-therapy">Peptide Therapy</Link></li>
            <li><Link href="/iv-therapy">IV Therapy</Link></li>
            <li><Link href="/hormone-optimization">Hormone Optimization</Link></li>
            <li><Link href="/weight-loss">Weight Loss</Link></li>
          </ul>
        </div>
        
        <div className="rm-footer-col">
          <h4>Info</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/gift-cards">Gift Cards</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="rm-footer-bottom">
        <p>© 2025 Range Medical. All rights reserved.</p>
        <div className="rm-footer-legal">
          <Link href="/terms-of-use">Terms</Link>
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/refund-policy">Refunds</Link>
        </div>
      </div>
    </footer>
  );
}
