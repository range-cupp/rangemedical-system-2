import ServicePageTemplate from '../components/ServicePageTemplate';
import { servicePages, defaultTestimonials } from '../data/servicePageData';

const data = servicePages['red-light-therapy'];

export default function RedLightTherapy() {
  return (
    <ServicePageTemplate
      seo={data.seo}
      badge={data.badge}
      title={data.title}
      subtitle={data.subtitle}
      ctaText="Book Your Assessment — $199"
      ctaLink="/book"
      ctaSecondary="Walk-ins welcome for red light sessions"
      isThisForYou={data.isThisForYou}
      howItWorks={data.howItWorks}
      testimonials={defaultTestimonials}
      faqs={data.faqs}
      finalCta={{
        title: "Ready to Try Red Light Therapy?",
        subtitle: "Book a session or schedule your Range Assessment to discuss a treatment plan."
      }}
    />
  );
}
