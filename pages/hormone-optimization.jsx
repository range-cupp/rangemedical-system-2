import ServicePageTemplate from '../components/ServicePageTemplate';
import { servicePages, defaultTestimonials } from '../data/servicePageData';

const data = servicePages['hormone-optimization'];

export default function HormoneOptimization() {
  return (
    <ServicePageTemplate
      seo={data.seo}
      badge={data.badge}
      title={data.title}
      subtitle={data.subtitle}
      ctaText="Book Your Assessment — $199"
      ctaLink="/book"
      ctaSecondary="Already a patient? Call or text (949) 997-3988"
      isThisForYou={data.isThisForYou}
      howItWorks={data.howItWorks}
      tools={data.tools}
      testimonials={defaultTestimonials}
      faqs={data.faqs}
      finalCta={{
        title: "Ready to Feel Like Yourself Again?",
        subtitle: "Book your Range Assessment. One visit to understand what's going on and build a clear plan."
      }}
    />
  );
}
