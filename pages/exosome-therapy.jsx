import ServicePageTemplate from '../components/ServicePageTemplate';
import { servicePages, defaultTestimonials } from '../data/servicePageData';

const data = servicePages['exosome-therapy'];

export default function ExosomeTherapy() {
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
      testimonials={defaultTestimonials}
      faqs={data.faqs}
      finalCta={{
        title: "Interested in Exosome Therapy?",
        subtitle: "Book your Range Assessment. Your provider will review your goals and determine if exosomes are a good fit."
      }}
    />
  );
}
