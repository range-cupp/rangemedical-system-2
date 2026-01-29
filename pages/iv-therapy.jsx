import ServicePageTemplate from '../components/ServicePageTemplate';
import { servicePages, defaultTestimonials } from '../data/servicePageData';

const data = servicePages['iv-therapy'];

export default function IVTherapy() {
  return (
    <ServicePageTemplate
      seo={data.seo}
      badge={data.badge}
      title={data.title}
      subtitle={data.subtitle}
      ctaText="Book Your Assessment — $199"
      ctaLink="/book"
      ctaSecondary="Walk-ins welcome for established patients"
      isThisForYou={data.isThisForYou}
      howItWorks={data.howItWorks}
      testimonials={defaultTestimonials}
      faqs={data.faqs}
      finalCta={{
        title: "Ready to Feel the Difference?",
        subtitle: "Book an IV session or schedule your Range Assessment to discuss your needs."
      }}
    />
  );
}
