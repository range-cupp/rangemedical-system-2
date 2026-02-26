import Layout from '../components/Layout';
import { useState, useEffect, useCallback } from 'react';

const TOTAL_PHOTOS = 125;

function getPhotos() {
  const photos = [];
  for (let i = 1; i <= TOTAL_PHOTOS; i++) {
    const num = String(i).padStart(3, '0');
    photos.push({
      thumb: `/grand-opening/thumbs/grand-opening-${num}.jpg`,
      full: `/grand-opening/full/grand-opening-${num}.jpg`,
      alt: `Grand Opening photo ${i}`,
    });
  }
  return photos;
}

const photos = getPhotos();

export default function GrandOpening() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const openLightbox = useCallback((index) => {
    setCurrentIndex(index);
    setImageLoaded(false);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const navigate = useCallback((dir) => {
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev + dir + TOTAL_PHOTOS) % TOTAL_PHOTOS);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, closeLightbox, navigate]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  // Touch swipe
  const [touchStartX, setTouchStartX] = useState(0);

  return (
    <Layout
      title="Grand Opening | Range Medical"
      description="Photos from Range Medical's Grand Opening celebration, January 22-24, 2026 in Newport Beach, CA."
    >
      {/* Hero */}
      <section className="go-hero">
        <div className="go-hero-label">Range Medical</div>
        <h1 className="go-hero-title">Grand Opening</h1>
        <p className="go-hero-subtitle">January 22&ndash;24, 2026 &middot; Newport Beach, CA</p>
        <div className="go-hero-divider" />
      </section>

      {/* Gallery */}
      <section className="go-gallery">
        <div className="go-masonry">
          {photos.map((photo, i) => (
            <div key={i} className="go-masonry-item" onClick={() => openLightbox(i)}>
              <img
                src={photo.thumb}
                alt={photo.alt}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="go-lightbox"
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          onTouchStart={(e) => setTouchStartX(e.changedTouches[0].screenX)}
          onTouchEnd={(e) => {
            const diff = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(diff) > 50) navigate(diff > 0 ? -1 : 1);
          }}
        >
          <button className="go-lb-close" onClick={closeLightbox} aria-label="Close">&times;</button>
          <button className="go-lb-nav go-lb-prev" onClick={(e) => { e.stopPropagation(); navigate(-1); }} aria-label="Previous">&#8249;</button>
          <button className="go-lb-nav go-lb-next" onClick={(e) => { e.stopPropagation(); navigate(1); }} aria-label="Next">&#8250;</button>
          <div className="go-lb-img-wrap">
            {!imageLoaded && <div className="go-lb-spinner" />}
            <img
              src={photos[currentIndex].full}
              alt={photos[currentIndex].alt}
              className={imageLoaded ? 'loaded' : ''}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          <div className="go-lb-counter">{currentIndex + 1} / {TOTAL_PHOTOS}</div>
        </div>
      )}

      <style jsx>{`
        /* Hero */
        .go-hero {
          background: #0a0a0a;
          text-align: center;
          padding: 80px 24px 60px;
        }
        .go-hero-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 16px;
        }
        .go-hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        .go-hero-subtitle {
          font-size: 1.125rem;
          color: #a3a3a3;
          font-weight: 400;
        }
        .go-hero-divider {
          width: 48px;
          height: 2px;
          background: #333;
          margin: 32px auto 0;
        }

        /* Gallery */
        .go-gallery {
          background: #0a0a0a;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 16px 80px;
        }
        .go-masonry {
          columns: 4;
          column-gap: 8px;
        }
        .go-masonry-item {
          break-inside: avoid;
          margin-bottom: 8px;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
        }
        .go-masonry-item img {
          width: 100%;
          display: block;
          transition: transform 0.3s ease, filter 0.3s ease;
        }
        .go-masonry-item:hover img {
          transform: scale(1.03);
          filter: brightness(1.08);
        }

        /* Lightbox */
        .go-lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .go-lb-img-wrap {
          position: relative;
          max-width: 90vw;
          max-height: 88vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .go-lb-img-wrap img {
          max-width: 90vw;
          max-height: 88vh;
          object-fit: contain;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .go-lb-img-wrap img.loaded {
          opacity: 1;
        }
        .go-lb-spinner {
          position: absolute;
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: #fff;
          border-radius: 50%;
          animation: go-spin 0.7s linear infinite;
        }
        @keyframes go-spin {
          to { transform: rotate(360deg); }
        }
        .go-lb-close {
          position: absolute;
          top: 16px;
          right: 20px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          z-index: 10;
        }
        .go-lb-close:hover {
          background: rgba(255, 255, 255, 0.18);
        }
        .go-lb-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          z-index: 10;
        }
        .go-lb-nav:hover {
          background: rgba(255, 255, 255, 0.18);
        }
        .go-lb-prev { left: 16px; }
        .go-lb-next { right: 16px; }
        .go-lb-counter {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .go-masonry { columns: 3; }
        }
        @media (max-width: 768px) {
          .go-hero { padding: 56px 24px 40px; }
          .go-hero-title { font-size: 2.25rem; }
          .go-hero-subtitle { font-size: 1rem; }
          .go-lb-nav { width: 40px; height: 40px; font-size: 20px; }
          .go-lb-prev { left: 8px; }
          .go-lb-next { right: 8px; }
          .go-lb-close { top: 10px; right: 12px; width: 38px; height: 38px; font-size: 24px; }
        }
        @media (max-width: 720px) {
          .go-masonry { columns: 2; column-gap: 6px; }
          .go-masonry-item { margin-bottom: 6px; border-radius: 4px; }
          .go-gallery { padding: 0 8px 48px; }
        }
        @media (max-width: 420px) {
          .go-masonry { columns: 2; column-gap: 4px; }
          .go-masonry-item { margin-bottom: 4px; border-radius: 3px; }
          .go-gallery { padding: 0 4px 40px; }
        }
      `}</style>
    </Layout>
  );
}
