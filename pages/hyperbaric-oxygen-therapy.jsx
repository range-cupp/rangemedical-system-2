import ServicePageTemplate from '../components/ServicePageTemplate';
import { servicePages, defaultTestimonials } from '../data/servicePageData';

const data = servicePages['hyperbaric-oxygen-therapy'];

export default function HyperbaricOxygenTherapy() {
  return (
    <ServicePageTemplate
      seo={data.seo}
      badge={data.badge}
      title={data.title}
      subtitle={data.subtitle}
      ctaText="Book Your Assessment — $199"
      ctaLink="/book"
      ctaSecondary="Or call (949) 997-3988 to schedule HBOT sessions"
      isThisForYou={data.isThisForYou}
      howItWorks={data.howItWorks}
      testimonials={defaultTestimonials}
      faqs={data.faqs}
      finalCta={{
        title: "Ready to Accelerate Your Healing?",
        subtitle: "Book your Range Assessment or schedule an HBOT session to get started."
      }}
    />
  );
}
