// Single source of truth for patient-facing injection demo videos.
// Videos are hosted on Vercel Blob. Public viewer page: /v/[slug].

export const INJECTION_VIDEOS = {
  'injection': {
    slug: 'injection',
    name: 'Injection Demo',
    icon: '💉',
    category: 'injection',
    title: 'How to Give Yourself an Injection',
    subtitle: 'A step-by-step walkthrough — remove the red cap, attach the needle, and inject.',
    videoUrl: 'https://sixcoo3swhy8bu1g.public.blob.vercel-storage.com/injection-videos/injection.mp4',
    steps: [
      'Wash your hands and wipe the vial top with an alcohol pad.',
      'Remove the red flip-top cap from the syringe — it\u2019s a stopper that keeps the medication from leaking during shipping.',
      'Thread the needle onto the Luer lock of the syringe until snug.',
      'Pull the plunger to your prescribed dose, pinch the skin, and inject at 90\u00B0.',
      'Dispose of the syringe in your sharps container.',
    ],
  },
};

export const INJECTION_VIDEO_LIST = Object.values(INJECTION_VIDEOS);

export function getInjectionVideo(slug) {
  return INJECTION_VIDEOS[slug] || null;
}
