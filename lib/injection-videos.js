// Single source of truth for patient-facing injection demo videos.
// Videos are hosted on Vercel Blob. Public viewer page: /v/[slug].

export const INJECTION_VIDEOS = {
  'b12': {
    slug: 'b12',
    name: 'B12 Injection',
    icon: '💉',
    category: 'injection',
    title: 'How to Give Yourself a B12 Injection',
    subtitle: 'A quick walkthrough — remove the red cap, attach the needle, and inject.',
    videoUrl: 'https://sixcoo3swhy8bu1g.public.blob.vercel-storage.com/injection-videos/b12-injection.mp4',
    steps: [
      'Wash your hands and wipe the vial top with an alcohol pad.',
      'Remove the red flip-top cap from the syringe (it keeps medication in during shipping).',
      'Thread the needle onto the Luer lock of the syringe until snug.',
      'Pull the plunger to the correct dose, then pinch the skin and inject at 90°.',
      'Dispose of the syringe in your sharps container.',
    ],
  },
  'weight-loss': {
    slug: 'weight-loss',
    name: 'Weight Loss Injection',
    icon: '⚖️',
    category: 'injection',
    title: 'How to Give Yourself Your Weight Loss Injection',
    subtitle: 'Same technique every week — remove the red cap, attach the needle, inject.',
    videoUrl: 'https://sixcoo3swhy8bu1g.public.blob.vercel-storage.com/injection-videos/weight-loss-injection.mp4',
    steps: [
      'Wash your hands and wipe the vial top with an alcohol pad.',
      'Remove the red flip-top cap from the syringe (it keeps medication in during shipping).',
      'Thread the needle onto the Luer lock of the syringe until snug.',
      'Pull the plunger to your prescribed dose, then pinch the skin on your abdomen and inject at 90°.',
      'Dispose of the syringe in your sharps container.',
    ],
  },
};

export const INJECTION_VIDEO_LIST = Object.values(INJECTION_VIDEOS);

export function getInjectionVideo(slug) {
  return INJECTION_VIDEOS[slug] || null;
}
