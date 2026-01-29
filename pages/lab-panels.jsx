import ServicePageTemplate from '../components/ServicePageTemplate';
import { servicePages, defaultTestimonials } from '../data/servicePageData';

const data = servicePages['lab-panels'];

export default function LabPanels() {
  return (
    <ServicePageTemplate
      seo={data.seo}
      badge={data.badge}
      title={data.title}
      subtitle={data.subtitle}
      ctaText="Book Your Assessment — $199"
      ctaLink="/book"
      ctaSecondary="Or call (949) 997-3988 to schedule labs directly"
      isThisForYou={data.isThisForYou}
      howItWorks={data.howItWorks}
      testimonials={defaultTestimonials}
      faqs={data.faqs}
      finalCta={{
        title: "Ready to See What's Really Going On?",
        subtitle: "Book your Range Assessment or schedule labs directly. We'll review everything together."
      }}
    />
  );
}
