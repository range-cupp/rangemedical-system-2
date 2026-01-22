import Head from 'next/head';

export default function ThreeXBlendGuide() {
  return (
    <>
      <Head>
        <title>3X Blend Guide | Range Medical</title>
        <meta name="description" content="Everything you need to know about your 3X Blend peptide therapy — how it works, how to inject, and what to expect." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <a href="/" className="block">
            <img 
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
              alt="Range Medical" 
              className="h-20 w-auto"
            />
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <a href="/range-assessment" className="text-gray-600 hover:text-black text-sm font-medium">Range Assessment</a>
            <a href="/peptide-therapy" className="text-gray-600 hover:text-black text-sm font-medium">Peptide Therapy</a>
            <a href="/lab-panels" className="text-gray-600 hover:text-black text-sm font-medium">Labs & Testing</a>
            <a href="/range-assessment#book" className="bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all">
              Book Assessment
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
            Your Peptide Protocol Guide
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style={{ letterSpacing: '-0.02em' }}>
            3X Blend
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Everything you need to know about your peptide therapy — how it works, how to inject, and what to expect.
          </p>
          <div className="inline-block bg-black text-white px-6 py-3 rounded-lg text-xl font-bold">
            $400/month
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="py-16 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            The Basics
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6" style={{ letterSpacing: '-0.02em' }}>
            What Are Peptides?
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Peptides are short chains of amino acids — the building blocks of proteins. They act as natural signals in your body, telling your cells what to do and when to do it.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Unlike many medicines that force change, peptides support your body's own processes. Think of them as a boost to what your body already knows how to do.
          </p>
        </div>
      </section>

      {/* Your Blend */}
      <section className="py-16 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Your Blend
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ letterSpacing: '-0.02em' }}>
            3X Blend
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Three peptides that work together to help your body release more growth hormone naturally.
          </p>

          {/* Tesamorelin */}
          <div className="bg-gray-50 rounded-xl p-6 mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>🧬</span> Tesamorelin
            </h3>
            <p className="text-sm text-gray-500 mb-4">The Main Signal</p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Tesamorelin tells your brain to release more growth hormone. It's the primary driver in this blend.
            </p>
            <ul className="space-y-2">
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Helps reduce belly fat
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Supports better body composition
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Studied by the FDA for safety
              </li>
            </ul>
          </div>

          {/* Ipamorelin */}
          <div className="bg-gray-50 rounded-xl p-6 mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>⚡</span> Ipamorelin
            </h3>
            <p className="text-sm text-gray-500 mb-4">The Clean Boost</p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Ipamorelin triggers growth hormone release in a gentle, clean way. It doesn't cause the side effects that other options do.
            </p>
            <ul className="space-y-2">
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Clean growth hormone pulse
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                No cortisol or hunger spikes
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Well-tolerated by most people
              </li>
            </ul>
          </div>

          {/* MGF */}
          <div className="bg-gray-50 rounded-xl p-6 mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>💪</span> MGF (Mechano Growth Factor)
            </h3>
            <p className="text-sm text-gray-500 mb-4">The Repair Helper</p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              MGF helps your muscles recover faster. It works right where your body needs it most.
            </p>
            <ul className="space-y-2">
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Speeds up muscle repair
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Supports tissue healing
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Works locally at injury sites
              </li>
            </ul>
          </div>

          {/* Why Together */}
          <div className="bg-black text-white rounded-xl p-6 mt-6">
            <h3 className="text-lg font-bold mb-2">Why Together?</h3>
            <p className="text-white/90 leading-relaxed">
              Each peptide does something different. Tesamorelin sends the signal. Ipamorelin amplifies it. MGF helps your body use the extra growth hormone for repair. Together, they work better than any one alone.
            </p>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-16 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Instructions
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ letterSpacing: '-0.02em' }}>
            How to Use Your Injections
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            We did your first injection together at the clinic. Here's how to stay on track at home.
          </p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Prep</h4>
                <p className="text-gray-600 leading-relaxed">
                  Wash your hands. Clean the injection site with an alcohol pad. Take the syringe out of the fridge a few minutes early to let it reach room temperature.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Inject</h4>
                <p className="text-gray-600 leading-relaxed">
                  Inject just under the skin (subcutaneous) into a fatty area — lower abdomen, upper thigh, or back of the arm. Pinch the skin, insert at a 45° angle, inject slowly.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Rotate Sites</h4>
                <p className="text-gray-600 leading-relaxed">
                  Don't inject in the same spot every day. Rotate between your abdomen, thighs, and arms to prevent irritation and ensure consistent absorption.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Dispose Safely</h4>
                <p className="text-gray-600 leading-relaxed">
                  Each syringe is single-use — do not reuse or recap. Dispose in a sharps container or bring used syringes back to the clinic.
                </p>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gray-50 rounded-xl p-6 mt-8">
            <h4 className="font-bold text-gray-900 mb-2">💡 Pro Tips</h4>
            <p className="text-gray-600 leading-relaxed">
              Inject on an empty stomach — no food 45 minutes before or after. Use it 5 days on, 2 days off. Keep syringes refrigerated. Set a daily phone reminder to stay consistent — same time every day keeps peptide levels stable and maximizes results.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Timeline
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ letterSpacing: '-0.02em' }}>
            What to Expect
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Everyone's different, but here's what patients typically experience.
          </p>

          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Weeks 1–2</h4>
              <p className="text-gray-600 leading-relaxed">
                Better sleep. More energy when you wake up. Some people feel it right away. Others take a little longer.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Weeks 3–4</h4>
              <p className="text-gray-600 leading-relaxed">
                Recovery feels faster. You might notice your workouts feel a bit easier. Energy stays more steady through the day.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Months 2–3</h4>
              <p className="text-gray-600 leading-relaxed">
                Body composition starts to shift. Less fat around the middle. Clothes fit differently. Skin may look healthier. The longer you stay consistent, the more you'll see.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="py-16 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Safety
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8" style={{ letterSpacing: '-0.02em' }}>
            Important Safety Information
          </h2>

          <div className="bg-gray-50 rounded-xl p-6 mb-4">
            <h4 className="font-bold text-gray-900 mb-4">Do Not Use If You Are:</h4>
            <ul className="space-y-2">
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Pregnant or breastfeeding
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Living with active cancer
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Managing serious liver, kidney, or heart conditions
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Dealing with uncontrolled medical conditions
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Allergic to any ingredient
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h4 className="font-bold text-gray-900 mb-4">Possible Side Effects:</h4>
            <ul className="space-y-2">
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Mild redness, swelling, or itching at injection site
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Slight headache or fatigue
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Tingling in hands or feet (usually temporary)
              </li>
              <li className="text-gray-600 flex items-start gap-2">
                <span className="text-black font-bold">•</span>
                Occasional water retention
              </li>
            </ul>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Usually mild and short-lived. If symptoms are moderate or severe, stop use and contact us.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Important:</strong> Peptides are classified for research purposes only and are not FDA-approved to diagnose, treat, cure, or prevent any disease. Handle and store as instructed. Individual results vary based on health status, dosage, and consistency.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions? We're Here.</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Whether you want to extend your protocol or add other therapies, our team can help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a 
              href="tel:+19499973988" 
              className="bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Call (949) 997-3988
            </a>
            <a 
              href="sms:+19499973988" 
              className="border-2 border-black text-black px-8 py-4 rounded-lg font-semibold hover:bg-black hover:text-white transition-all"
            >
              Text Us
            </a>
          </div>
          <p className="text-gray-500 text-sm">
            📍 1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <img 
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
              alt="Range Medical" 
              className="h-10 w-auto brightness-0 invert"
            />
            <div className="text-center md:text-left text-white/70 text-sm">
              Upstairs from Range Sports Therapy.<br />
              Newport Beach, California.<br />
              <a href="tel:+19499973988" className="hover:text-white">(949) 997-3988</a>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="/terms-of-use" className="text-white/70 hover:text-white">Terms</a>
              <a href="/privacy-policy" className="text-white/70 hover:text-white">Privacy</a>
              <a href="/refund-policy" className="text-white/70 hover:text-white">Refunds</a>
            </div>
          </div>
          <div className="text-center text-white/50 text-sm mt-8">
            © 2025 Range Medical. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
