// /pages/track/[token].js
// Patient-facing injection tracker

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PatientTracker() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // null, 'instructions', or 'about'
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/patient/tracker?token=${token}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Protocol not found. Please check your link.');
      }
    } catch (err) {
      setError('Unable to load your protocol. Please try again.');
    }
    setLoading(false);
  };

  // Determine if a day is an "off" day based on frequency
  const isOffDay = (dayNumber, frequency, startDate) => {
    if (!frequency) return false;
    
    // 5 days on / 2 days off - days 6, 7, 13, 14, 20, 21, etc. are off
    if (frequency.includes('5 days on')) {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle === 6 || dayInCycle === 7;
    }
    
    // 1x weekly - only day 1, 8, 15, 22, etc. are injection days
    if (frequency === '1x weekly') {
      return ((dayNumber - 1) % 7) !== 0;
    }
    
    // 2x weekly (Mon/Thu) - injection on Mon and Thu
    if (frequency === '2x weekly (Mon/Thu)') {
      // Calculate the actual day of week for this day
      if (startDate) {
        const start = new Date(startDate);
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + dayNumber - 1);
        const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, 4=Thu
        return dayOfWeek !== 1 && dayOfWeek !== 4;
      }
      // Fallback: Mon/Thu pattern assuming day 1 is Monday
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 1 && dayInCycle !== 4;
    }
    
    // 2x weekly (Tue/Fri) - injection on Tue and Fri
    if (frequency === '2x weekly (Tue/Fri)') {
      if (startDate) {
        const start = new Date(startDate);
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + dayNumber - 1);
        const dayOfWeek = currentDate.getDay(); // 2=Tue, 5=Fri
        return dayOfWeek !== 2 && dayOfWeek !== 5;
      }
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 2 && dayInCycle !== 5;
    }
    
    // 2x weekly (any days) - days 1, 4, 8, 11, 15, 18, etc. (every 3-4 days)
    if (frequency === '2x weekly' || frequency.includes('2x weekly (any')) {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 1 && dayInCycle !== 4;
    }
    
    // 3x weekly (Mon/Wed/Fri) - injection on Mon, Wed, Fri
    if (frequency === '3x weekly (Mon/Wed/Fri)') {
      if (startDate) {
        const start = new Date(startDate);
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + dayNumber - 1);
        const dayOfWeek = currentDate.getDay(); // 1=Mon, 3=Wed, 5=Fri
        return dayOfWeek !== 1 && dayOfWeek !== 3 && dayOfWeek !== 5;
      }
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 1 && dayInCycle !== 3 && dayInCycle !== 5;
    }
    
    // 3x weekly (any days) - days 1, 3, 5, 8, 10, 12, etc.
    if (frequency === '3x weekly' || frequency.includes('3x weekly (any')) {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 1 && dayInCycle !== 3 && dayInCycle !== 5;
    }
    
    // Every other day
    if (frequency === 'Every other day') {
      return dayNumber % 2 === 0;
    }
    
    // 1x monthly - only day 1, 31, 61, etc. are session days
    if (frequency === '1x monthly') {
      return ((dayNumber - 1) % 30) !== 0;
    }
    
    // As needed - no off days, but also no required days
    if (frequency === 'As needed') {
      return false; // All days available to log if needed
    }
    
    return false;
  };

  // Transform peptide names for display
  const getDisplayName = (peptideName) => {
    if (!peptideName) return '';
    
    // BPC-157 variants should show as Wolverine
    if (peptideName.toLowerCase().includes('bpc-157') && !peptideName.toLowerCase().includes('tb')) {
      return 'Wolverine BPC-157 / TB-500';
    }
    if (peptideName.toLowerCase() === 'bpc-157') {
      return 'Wolverine BPC-157 / TB-500';
    }
    if (peptideName.toLowerCase().includes('bpc') && !peptideName.toLowerCase().includes('wolverine') && !peptideName.toLowerCase().includes('tb')) {
      return 'Wolverine BPC-157 / TB-500';
    }
    
    return peptideName;
  };

  // Get simple explanation for a peptide
  const getPeptideExplanation = (peptideName) => {
    if (!peptideName) return null;
    const name = peptideName.toLowerCase();

    // ============================================
    // BLENDS FIRST (check before individual peptides)
    // ============================================

    // Wolverine Blend (BPC + TB) - check before BPC or TB individually
    if (name.includes('wolverine') || (name.includes('bpc') && name.includes('tb'))) {
      return {
        name: 'Wolverine Blend (BPC-157 + TB-500)',
        what: 'This blend has two healing peptides: BPC-157 and TB-500. They work as a team.',
        how: 'BPC-157 helps repair tissue. TB-500 helps cells grow and move where needed. Together they give your body more tools to heal.',
        benefits: [
          'Faster recovery from workouts',
          'Helps heal muscles and tendons',
          'Supports joint health',
          'May reduce discomfort from injuries'
        ],
        tip: 'Take this blend any time of day. It works with or without food.',
        note: 'Results vary. Popular with active people who want to recover faster.'
      };
    }

    // KLOW blend - check before GLOW, GHK, KPV, BPC, TB
    if (name.includes('klow')) {
      return {
        name: 'KLOW Blend (GHK-Cu + KPV + BPC-157 + TB-500)',
        what: 'KLOW has GHK-Cu, KPV, BPC-157, and TB-500. It supports skin health and calming.',
        how: 'Each peptide works on a different part of skin health. Together they support repair, calming, and collagen.',
        benefits: [
          'Supports skin health and repair',
          'Helps calm skin irritation',
          'Supports collagen production',
          'Promotes overall healing'
        ],
        tip: 'Take any time of day. Stay hydrated for best results.',
        note: 'Results vary from person to person.'
      };
    }

    // GLOW blend - check before GHK, BPC, TB
    if (name.includes('glow')) {
      return {
        name: 'GLOW Blend (GHK-Cu + BPC-157 + TB-500)',
        what: 'GLOW combines GHK-Cu with BPC-157 and TB-500. It supports your skin from the inside.',
        how: 'GHK-Cu helps skin make collagen. BPC-157 and TB-500 help skin heal. Together they support a healthy glow.',
        benefits: [
          'Supports skin health',
          'Helps with skin firmness',
          'May improve skin texture',
          'Supports overall healing'
        ],
        tip: 'Take any time of day. Drink plenty of water and protect skin from sun.',
        note: 'Results vary from person to person.'
      };
    }

    // CJC/Ipamorelin blend - check before CJC or Ipamorelin individually
    if ((name.includes('cjc') && name.includes('ipamorelin')) || name.includes('cjc/ipa') || name.includes('cjc-ipa')) {
      return {
        name: 'CJC-1295 / Ipamorelin',
        what: 'This blend has two peptides: CJC-1295 and Ipamorelin. They work as a team.',
        how: 'CJC-1295 extends growth hormone release. Ipamorelin triggers the release gently. Together they are stronger than either alone.',
        benefits: [
          'Stronger growth hormone release',
          'Supports deep sleep',
          'Helps with recovery',
          'Gentle with few side effects'
        ],
        tip: 'Take at NIGHT, right before bed. Do not eat for 2 hours before and 30 minutes after. This works best with your natural sleep cycle.',
        note: 'Results vary. This is one of the most popular GH combinations.'
      };
    }

    // Tesamorelin/Ipamorelin blend - check before individual
    if (name.includes('tesamorelin') && name.includes('ipamorelin')) {
      return {
        name: 'Tesamorelin / Ipamorelin',
        what: 'This combines Tesamorelin and Ipamorelin. Together they strongly support growth hormone.',
        how: 'Both peptides signal growth hormone release. Tesamorelin is especially good for belly fat.',
        benefits: [
          'Strong growth hormone support',
          'May help reduce belly fat',
          'Supports sleep and recovery',
          'Supports body composition'
        ],
        tip: 'Take at NIGHT, right before bed. Do not eat for 2 hours before.',
        note: 'Results vary. May take 2-3 months for body changes.'
      };
    }

    // Sermorelin/Ipamorelin blend - check before individual
    if (name.includes('sermorelin') && name.includes('ipamorelin')) {
      return {
        name: 'Sermorelin / Ipamorelin',
        what: 'This blend combines Sermorelin and Ipamorelin for growth hormone support.',
        how: 'Both peptides work together to signal your body to make more growth hormone naturally.',
        benefits: [
          'Supports natural growth hormone',
          'May improve sleep',
          'Supports recovery',
          'Gentle with few side effects'
        ],
        tip: 'Take at NIGHT, right before bed. Do not eat for 2 hours before.',
        note: 'Results vary. Better sleep often noticed first.'
      };
    }

    // ============================================
    // INDIVIDUAL PEPTIDES (after blends)
    // ============================================

    // BPC-157 (alone)
    if (name.includes('bpc')) {
      return {
        name: 'BPC-157',
        what: 'BPC-157 is a healing peptide. It comes from a protein found in your stomach.',
        how: 'This peptide helps your body heal faster. It sends signals to cells that fix muscles, tendons, and gut lining. It also helps calm swelling.',
        benefits: [
          'Helps heal muscles and tendons',
          'Supports gut health',
          'May reduce discomfort from injuries',
          'Helps your body recover faster'
        ],
        tip: 'You can take BPC-157 any time of day. It works with or without food.',
        note: 'Results vary. Most people notice changes within 2-4 weeks.'
      };
    }

    // TB-500 / Thymosin Beta-4 (alone)
    if (name.includes('tb-500') || name.includes('tb500') || name.includes('tb 500') || (name.includes('thymosin') && name.includes('beta'))) {
      return {
        name: 'TB-500 (Thymosin Beta-4)',
        what: 'TB-500 is a healing peptide. Your body makes a protein like this called Thymosin Beta-4.',
        how: 'TB-500 helps new blood vessels form. It helps cells move to where they need to go. This speeds up healing.',
        benefits: [
          'Supports tissue repair',
          'Helps with flexibility',
          'May reduce recovery time',
          'Supports healthy inflammation response'
        ],
        tip: 'TB-500 can be taken any time of day. It works with or without food.',
        note: 'Results vary. Often combined with BPC-157 for better results.'
      };
    }

    // GHK-Cu (alone, not in blends)
    if (name.includes('ghk')) {
      return {
        name: 'GHK-Cu (Copper Peptide)',
        what: 'GHK-Cu is a peptide with copper. Your body makes this naturally but makes less as you age.',
        how: 'GHK-Cu tells your skin to make more collagen. Collagen keeps skin firm and smooth.',
        benefits: [
          'Supports healthy, firm skin',
          'May improve skin texture',
          'Helps with skin healing',
          'Supports hair health'
        ],
        tip: 'GHK-Cu can be taken any time. Drink water and protect skin from sun.',
        note: 'Results vary. Many people see skin changes in 4-8 weeks.'
      };
    }

    // KPV (alone)
    if (name.includes('kpv')) {
      return {
        name: 'KPV',
        what: 'KPV is a small peptide made of three amino acids. It comes from a hormone that calms inflammation.',
        how: 'KPV helps calm your immune system. It can reduce redness and irritation in skin and gut.',
        benefits: [
          'Helps calm inflammation',
          'Supports skin health',
          'May help with gut issues',
          'Supports immune balance'
        ],
        tip: 'KPV can be taken any time of day. It works with or without food.',
        note: 'Results vary from person to person.'
      };
    }

    // AOD-9604
    if (name.includes('aod')) {
      return {
        name: 'AOD-9604',
        what: 'AOD-9604 comes from growth hormone. It is the part that helps your body burn fat.',
        how: 'This peptide tells fat cells to release stored fat. Your body can then burn it for energy. It does not affect muscle or blood sugar.',
        benefits: [
          'Supports fat burning',
          'Does not affect muscle',
          'Does not raise blood sugar',
          'May support weight goals'
        ],
        tip: 'Take AOD-9604 in the morning on an empty stomach. Wait 20-30 minutes before eating.',
        note: 'Results vary. Works best with healthy eating and exercise.'
      };
    }

    // MOTS-C
    if (name.includes('mots')) {
      return {
        name: 'MOTS-C',
        what: 'MOTS-C is made by your mitochondria. Mitochondria are the parts of cells that make energy.',
        how: 'MOTS-C helps cells use sugar for energy. It helps muscles work better during exercise.',
        benefits: [
          'Supports energy levels',
          'Helps with exercise',
          'Supports metabolism',
          'May help blood sugar balance'
        ],
        tip: 'Take MOTS-C in the morning on an empty stomach, before exercise.',
        note: 'Results vary. Many people feel more energy in 2-3 weeks.'
      };
    }

    // GLP-1 S (Semaglutide)
    if (name.includes('glp-1 s') || (name.includes('semaglutide') && !name.includes('tir'))) {
      return {
        name: 'Semaglutide (GLP-1)',
        what: 'Semaglutide copies a hormone your gut makes after eating. It helps control hunger.',
        how: 'This peptide slows how fast food leaves your stomach. You feel full longer. It also helps blood sugar.',
        benefits: [
          'Helps reduce appetite',
          'Helps you feel full longer',
          'Supports blood sugar balance',
          'Supports weight goals'
        ],
        tip: 'Take once a week on the same day. Eat slowly and stop when full. Drink lots of water.',
        note: 'Results vary. Start low and increase slowly. Nausea may happen at first.'
      };
    }

    // GLP-1 T (Tirzepatide)
    if (name.includes('glp-1 t') || name.includes('tirzepatide')) {
      return {
        name: 'Tirzepatide (GLP-1/GIP)',
        what: 'Tirzepatide works on two gut hormones: GLP-1 and GIP. Both help control hunger.',
        how: 'This peptide slows digestion and helps you feel full. Working on two pathways may give stronger results.',
        benefits: [
          'Helps reduce appetite',
          'Helps you feel full longer',
          'Supports blood sugar balance',
          'May give stronger weight support'
        ],
        tip: 'Take once a week on the same day. Eat slowly and stop when full. Drink lots of water.',
        note: 'Results vary. Start low and increase slowly.'
      };
    }

    // GLP-1 R (Retatrutide)
    if (name.includes('glp-1 r') || name.includes('retatrutide')) {
      return {
        name: 'Retatrutide (Triple)',
        what: 'Retatrutide works on three pathways: GLP-1, GIP, and glucagon. This is called a triple agonist.',
        how: 'It controls hunger, blood sugar, and may help burn more energy. Three pathways may give the strongest results.',
        benefits: [
          'Helps reduce appetite',
          'Supports blood sugar balance',
          'May increase energy burning',
          'Supports weight goals'
        ],
        tip: 'Take once a week on the same day. Drink plenty of water.',
        note: 'Results vary. This is a newer peptide.'
      };
    }

    // Survodutide
    if (name.includes('survodutide')) {
      return {
        name: 'Survodutide',
        what: 'Survodutide works on GLP-1 and glucagon receptors. It helps control appetite and metabolism.',
        how: 'This peptide helps you feel full and may help your body burn more energy.',
        benefits: [
          'Helps reduce appetite',
          'Supports metabolism',
          'May help with weight goals',
          'Works on two pathways'
        ],
        tip: 'Take once a week on the same day. Drink plenty of water.',
        note: 'Results vary from person to person.'
      };
    }

    // Cagrilintide
    if (name.includes('cagrilintide')) {
      return {
        name: 'Cagrilintide',
        what: 'Cagrilintide copies a hormone called amylin. Amylin helps control appetite after meals.',
        how: 'This peptide helps you feel full faster and stay full longer after eating.',
        benefits: [
          'Helps reduce appetite',
          'Helps you feel full faster',
          'Supports weight goals',
          'Works differently than GLP-1'
        ],
        tip: 'Take as directed. Drink plenty of water and eat slowly.',
        note: 'Results vary from person to person.'
      };
    }

    // Epithalon
    if (name.includes('epithalon') || name.includes('epitalon')) {
      return {
        name: 'Epithalon',
        what: 'Epithalon supports your telomeres. Telomeres are caps on your DNA that protect it, like plastic tips on shoelaces.',
        how: 'As you age, telomeres get shorter. Epithalon may help protect them. This is linked to healthy aging.',
        benefits: [
          'Supports healthy aging',
          'May improve sleep',
          'Supports cell health',
          'May support energy'
        ],
        tip: 'Take any time of day. Often used in cycles of 10-20 days.',
        note: 'Results vary. Often used as part of a longevity plan.'
      };
    }

    // Thymosin Alpha-1
    if (name.includes('thymosin alpha') || name.includes('ta-1') || name.includes('ta1')) {
      return {
        name: 'Thymosin Alpha-1',
        what: 'TA1 supports your immune system. Your thymus gland makes it naturally.',
        how: 'This peptide helps immune cells work better. It helps your body fight germs and stay healthy.',
        benefits: [
          'Supports immune function',
          'Helps your body stay healthy',
          'Supports recovery from illness',
          'May help during stress'
        ],
        tip: 'TA1 can be taken any time. Often taken 2-3 times per week.',
        note: 'Results vary. Used to support overall wellness.'
      };
    }

    // PT-141
    if (name.includes('pt-141')) {
      return {
        name: 'PT-141',
        what: 'PT-141 works in your brain. It affects pathways that control desire.',
        how: 'PT-141 activates special receptors in your brain. This can increase feelings of desire.',
        benefits: [
          'May support healthy desire',
          'Works through the brain',
          'Can be used as needed',
          'Works for men and women'
        ],
        tip: 'Take 45-60 minutes before desired effect. Do not use more than once in 24 hours.',
        note: 'Results vary. Some feel flushing or nausea which usually passes.'
      };
    }

    // Sermorelin
    if (name.includes('sermorelin') && !name.includes('ipamorelin')) {
      return {
        name: 'Sermorelin',
        what: 'Sermorelin tells your body to make more growth hormone. It signals your pituitary gland.',
        how: 'Your pituitary gland is in your brain. When it gets this signal, it makes more of your own natural growth hormone.',
        benefits: [
          'Supports natural growth hormone',
          'May improve sleep',
          'Supports recovery',
          'May support energy and body composition'
        ],
        tip: 'Take at NIGHT, right before bed. Do not eat for 2 hours before. This works with your natural sleep cycle.',
        note: 'Results vary. Better sleep is often noticed first.'
      };
    }

    // Tesamorelin (alone)
    if (name.includes('tesamorelin') && !name.includes('ipamorelin')) {
      return {
        name: 'Tesamorelin',
        what: 'Tesamorelin signals your pituitary to release growth hormone. It is known for helping reduce belly fat.',
        how: 'This peptide causes your body to make more growth hormone naturally. It is especially helpful for belly fat.',
        benefits: [
          'Supports natural growth hormone',
          'May help reduce belly fat',
          'Supports body composition',
          'May improve energy and recovery'
        ],
        tip: 'Take at NIGHT, right before bed. Do not eat for 2 hours before.',
        note: 'Results vary. May take 2-3 months for body changes.'
      };
    }

    // Ipamorelin (alone)
    if (name.includes('ipamorelin') && !name.includes('cjc') && !name.includes('tesamorelin') && !name.includes('sermorelin')) {
      return {
        name: 'Ipamorelin',
        what: 'Ipamorelin is a gentle growth hormone peptide. It tells your pituitary to release growth hormone.',
        how: 'Ipamorelin causes growth hormone release without strongly affecting other hormones. It has very few side effects.',
        benefits: [
          'Supports growth hormone release',
          'Very few side effects',
          'Does not increase hunger',
          'Supports sleep and recovery'
        ],
        tip: 'Take at NIGHT, right before bed. Do not eat for 2 hours before and 30 minutes after.',
        note: 'Results vary. Popular because it is gentle.'
      };
    }

    // CJC-1295 with DAC
    if (name.includes('cjc') && name.includes('dac') && !name.includes('no dac') && !name.includes('without')) {
      return {
        name: 'CJC-1295 with DAC',
        what: 'CJC-1295 with DAC is a long-acting growth hormone peptide. DAC makes it last longer in your body.',
        how: 'This peptide raises growth hormone steadily over days instead of short pulses. One injection works for about a week.',
        benefits: [
          'Raises growth hormone steadily',
          'Only needs to be taken 1-2 times per week',
          'Supports body composition over time',
          'More convenient dosing'
        ],
        tip: 'Take 1-2 times per week. Can be taken any time. Do not eat for 1 hour before.',
        note: 'Results vary. The steady release is different from natural pulsing.'
      };
    }

    // CJC-1295 no DAC (alone)
    if (name.includes('cjc') && !name.includes('ipamorelin')) {
      return {
        name: 'CJC-1295 (no DAC)',
        what: 'CJC-1295 without DAC is a growth hormone releasing peptide. It causes a burst of growth hormone.',
        how: 'This peptide signals your pituitary gland to release growth hormone in a pulse, similar to your natural pattern.',
        benefits: [
          'Supports natural growth hormone pulses',
          'May improve sleep',
          'Supports recovery',
          'Supports body composition'
        ],
        tip: 'Take at NIGHT, right before bed. Do not eat for 2 hours before and 30 minutes after.',
        note: 'Results vary. Often combined with Ipamorelin.'
      };
    }

    // GHRP-2
    if (name.includes('ghrp-2') || name.includes('ghrp2')) {
      return {
        name: 'GHRP-2',
        what: 'GHRP-2 is a growth hormone releasing peptide. It causes strong growth hormone release.',
        how: 'GHRP-2 works on ghrelin receptors in your brain. It may increase hunger and slightly raise cortisol.',
        benefits: [
          'Strong growth hormone release',
          'Supports muscle growth',
          'May improve sleep',
          'Supports body composition'
        ],
        tip: 'Take at NIGHT before bed. Do not eat for 2 hours before. It may increase hunger.',
        note: 'Results vary. Stronger than Ipamorelin.'
      };
    }

    // GHRP-6
    if (name.includes('ghrp-6') || name.includes('ghrp6')) {
      return {
        name: 'GHRP-6',
        what: 'GHRP-6 causes strong growth hormone release. It is known for increasing hunger.',
        how: 'GHRP-6 works on ghrelin receptors. Ghrelin is your hunger hormone. This strongly increases appetite.',
        benefits: [
          'Strong growth hormone release',
          'Increases appetite (good for gaining)',
          'Supports muscle growth',
          'May help gut healing'
        ],
        tip: 'Take at NIGHT before bed. Do not eat for 2 hours before. Expect hunger about 20 minutes after.',
        note: 'Results vary. Best for people who want to gain weight or muscle.'
      };
    }

    // MK-677 / Ibutamoren
    if (name.includes('mk-677') || name.includes('mk677') || name.includes('ibutamoren')) {
      return {
        name: 'MK-677',
        what: 'MK-677 is an oral growth hormone peptide. You take it as a pill, not an injection.',
        how: 'MK-677 mimics ghrelin and causes growth hormone release. Effects last about 24 hours.',
        benefits: [
          'No injections - taken by mouth',
          'Raises growth hormone',
          'May improve sleep',
          'Supports muscle and recovery'
        ],
        tip: 'Take at NIGHT before bed. It may increase hunger. Start with a lower dose.',
        note: 'Results vary. May cause water retention at first.'
      };
    }

    // Selank
    if (name.includes('selank')) {
      return {
        name: 'Selank',
        what: 'Selank supports your brain. It helps with focus and calm without drowsiness.',
        how: 'Selank works on GABA pathways. GABA helps you feel calm. It also supports focus and memory.',
        benefits: [
          'Supports focus and clarity',
          'May help with feeling calm',
          'Supports memory',
          'Does not cause drowsiness'
        ],
        tip: 'Usually taken as a nasal spray. Use 1-2 sprays per nostril. Can use any time.',
        note: 'Results often felt in 15-30 minutes.'
      };
    }

    // Semax
    if (name.includes('semax')) {
      return {
        name: 'Semax',
        what: 'Semax supports brain function and mental clarity.',
        how: 'Semax supports BDNF, which helps brain cells grow and connect. It supports clear thinking.',
        benefits: [
          'Supports mental clarity',
          'May help with focus',
          'Supports brain health',
          'May support memory'
        ],
        tip: 'Usually taken as a nasal spray in the morning. Avoid late in day as it may affect sleep.',
        note: 'Results often felt in 15-30 minutes.'
      };
    }

    // Dihexa
    if (name.includes('dihexa')) {
      return {
        name: 'Dihexa',
        what: 'Dihexa supports brain connections. It is studied for memory and mental clarity.',
        how: 'Dihexa helps a growth factor called HGF work better. This supports connections between brain cells.',
        benefits: [
          'May support memory',
          'Supports brain cell connections',
          'Very potent in small doses',
          'Being studied for cognitive support'
        ],
        tip: 'Taken by mouth as a small tablet in the morning. Start with lowest dose.',
        note: 'Results vary. This is a research peptide.'
      };
    }

    // NAD+
    if (name.includes('nad')) {
      return {
        name: 'NAD+',
        what: 'NAD+ is a molecule your cells need to make energy. You make less as you age.',
        how: 'NAD+ helps your mitochondria work better. Mitochondria are like batteries in your cells.',
        benefits: [
          'Supports cellular energy',
          'May help with mental clarity',
          'Supports healthy aging',
          'May improve recovery'
        ],
        tip: 'Can be taken by injection or IV. Flushing or warmth is normal and passes.',
        note: 'Results vary. Many feel more energy within days.'
      };
    }

    // DSIP
    if (name.includes('dsip')) {
      return {
        name: 'DSIP',
        what: 'DSIP stands for Delta Sleep Inducing Peptide. It supports deep sleep.',
        how: 'DSIP works on sleep pathways in your brain. It may help you fall asleep and stay in deep sleep.',
        benefits: [
          'Supports falling asleep',
          'May improve deep sleep',
          'Supports natural sleep cycles',
          'May help with stress'
        ],
        tip: 'Take 30-60 minutes before bed.',
        note: 'Results vary from person to person.'
      };
    }

    // LL-37
    if (name.includes('ll-37')) {
      return {
        name: 'LL-37',
        what: 'LL-37 is an antimicrobial peptide. Your immune system makes it to fight germs.',
        how: 'LL-37 can kill bacteria directly. It also helps control inflammation and wound healing.',
        benefits: [
          'Supports immune defense',
          'May help with infections',
          'Supports wound healing',
          'Helps control inflammation'
        ],
        tip: 'Follow your provider dosing instructions carefully.',
        note: 'Results vary. Often used for immune support.'
      };
    }

    // Gonadorelin
    if (name.includes('gonadorelin')) {
      return {
        name: 'Gonadorelin',
        what: 'Gonadorelin signals your body to make testosterone. It copies a hormone your brain makes.',
        how: 'Gonadorelin tells your pituitary gland to release hormones that make testosterone and support fertility.',
        benefits: [
          'Supports natural testosterone',
          'Helps maintain fertility',
          'Often used with TRT',
          'Supports testicular function'
        ],
        tip: 'Usually taken 2-3 times per week. Can be taken any time of day.',
        note: 'Results vary. Often used by men on testosterone therapy.'
      };
    }

    // MT-II / Melanotan
    if (name.includes('mt-ii') || name.includes('mt-2') || name.includes('melanotan')) {
      return {
        name: 'Melanotan II',
        what: 'Melanotan II affects skin color. It can cause tanning without sun.',
        how: 'This peptide increases melanin in your skin. It can also affect appetite and desire.',
        benefits: [
          'Promotes skin tanning',
          'May reduce need for sun',
          'May support libido',
          'May reduce appetite'
        ],
        tip: 'Start with a very low dose. Take before bed to reduce nausea. Still protect skin from sun.',
        note: 'Results vary. New moles should be checked by a doctor.'
      };
    }

    // 5-Amino-1MQ
    if (name.includes('5-amino') || name.includes('1mq')) {
      return {
        name: '5-Amino-1MQ',
        what: '5-Amino-1MQ supports metabolism. It blocks an enzyme that can slow fat burning.',
        how: 'When this enzyme is blocked, your cells burn more energy. This may help with fat loss.',
        benefits: [
          'Supports fat burning',
          'May increase energy burning',
          'Supports metabolism',
          'Taken by mouth (no injection)'
        ],
        tip: 'Take in the morning with or without food.',
        note: 'Results vary. Works best with healthy eating and exercise.'
      };
    }

    // Tesofensine
    if (name.includes('tesofensine')) {
      return {
        name: 'Tesofensine',
        what: 'Tesofensine affects brain chemicals. It was studied for brain conditions but showed weight loss benefits.',
        how: 'It increases dopamine, serotonin, and norepinephrine. This can reduce appetite.',
        benefits: [
          'May reduce appetite',
          'Supports feeling of fullness',
          'May support mood',
          'Supports weight management'
        ],
        tip: 'Take in the morning. Do not take late in day as it may affect sleep.',
        note: 'Results vary. Follow dosing instructions carefully.'
      };
    }

    // Oxytocin
    if (name.includes('oxytocin')) {
      return {
        name: 'Oxytocin',
        what: 'Oxytocin is the bonding hormone. Your body makes it during positive social times.',
        how: 'Oxytocin affects areas of your brain for trust, bonding, and calm.',
        benefits: [
          'Supports feelings of connection',
          'May help with stress',
          'Supports social bonding',
          'May support intimacy'
        ],
        tip: 'Usually taken as a nasal spray. Use as directed.',
        note: 'Results vary from person to person.'
      };
    }

    // Kisspeptin
    if (name.includes('kisspeptin')) {
      return {
        name: 'Kisspeptin',
        what: 'Kisspeptin is a hormone that signals your body to make reproductive hormones.',
        how: 'It tells your brain to release hormones that support testosterone and fertility.',
        benefits: [
          'Supports hormone production',
          'May support fertility',
          'Works naturally with your body',
          'Supports reproductive health'
        ],
        tip: 'Follow your provider dosing instructions.',
        note: 'Results vary from person to person.'
      };
    }

    // IGF-1
    if (name.includes('igf-1') || name.includes('igf1')) {
      return {
        name: 'IGF-1 LR3',
        what: 'IGF-1 is a growth factor. It is what growth hormone turns into to do its work.',
        how: 'IGF-1 supports cell growth and repair. It is especially active in muscle cells.',
        benefits: [
          'Supports muscle growth',
          'Supports cell repair',
          'May improve recovery',
          'Works directly'
        ],
        tip: 'Usually taken in the morning or after workouts.',
        note: 'Results vary. This is a powerful peptide - follow dosing carefully.'
      };
    }

    // Follistatin
    if (name.includes('follistatin')) {
      return {
        name: 'Follistatin',
        what: 'Follistatin blocks myostatin. Myostatin limits how much muscle you can build.',
        how: 'By blocking myostatin, your body may be able to build more muscle.',
        benefits: [
          'May support muscle growth',
          'Blocks muscle-limiting signals',
          'Supports strength gains',
          'Being studied for muscle conditions'
        ],
        tip: 'Follow your provider dosing instructions.',
        note: 'Results vary. This is a research peptide.'
      };
    }

    // SS-31 / Elamipretide
    if (name.includes('ss-31') || name.includes('elamipretide')) {
      return {
        name: 'SS-31',
        what: 'SS-31 supports your mitochondria. It can enter them and help them work better.',
        how: 'SS-31 protects the inner part of mitochondria. This helps cells make energy better.',
        benefits: [
          'Supports mitochondria health',
          'May increase cellular energy',
          'Supports healthy aging',
          'Being studied for heart and muscle'
        ],
        tip: 'Can be taken any time of day. Follow dosing instructions.',
        note: 'Results vary. Targets the root of cellular energy.'
      };
    }

    // FOXO4-DRI
    if (name.includes('foxo4')) {
      return {
        name: 'FOXO4-DRI',
        what: 'FOXO4-DRI is a longevity peptide. It helps your body clear out old, damaged cells.',
        how: 'Old cells that do not work well are called senescent cells. This peptide may help remove them.',
        benefits: [
          'Supports healthy aging',
          'May help clear old cells',
          'Supports cellular health',
          'Being studied for longevity'
        ],
        tip: 'Usually used in short cycles. Follow provider instructions.',
        note: 'Results vary. This is a research peptide for longevity.'
      };
    }

    // VIP
    if (name.includes('vip') && !name.includes('kisspeptin')) {
      return {
        name: 'VIP',
        what: 'VIP is Vasoactive Intestinal Peptide. It helps with inflammation and immune balance.',
        how: 'VIP supports many body systems. It may help calm inflammation and support gut and brain health.',
        benefits: [
          'Supports immune balance',
          'May help with inflammation',
          'Supports gut health',
          'Supports brain health'
        ],
        tip: 'Usually taken as a nasal spray. Follow provider instructions.',
        note: 'Results vary. Often used for chronic inflammatory conditions.'
      };
    }

    // ===== HRT / HORMONE THERAPY =====
    
    // Testosterone
    if (name.includes('testosterone')) {
      return {
        name: 'Testosterone',
        what: 'Testosterone is the main male hormone. It plays a key role in energy, muscle, mood, and overall health.',
        how: 'Testosterone replacement brings your levels back to a healthy range. This helps your body function optimally.',
        benefits: [
          'Supports energy and vitality',
          'Helps maintain muscle mass',
          'Supports mood and mental clarity',
          'Supports healthy libido',
          'May improve sleep quality'
        ],
        tip: 'Inject on the SAME DAYS each week (usually Monday/Thursday). Rotate injection sites between left and right thigh or glutes.',
        note: 'Consistency is key. Labs are typically checked at weeks 6-8 and 10-12 to optimize your dose.'
      };
    }

    // Estradiol
    if (name.includes('estradiol') || name.includes('estrogen')) {
      return {
        name: 'Estradiol',
        what: 'Estradiol is the main form of estrogen. It supports many body functions in both women and men.',
        how: 'Estradiol replacement helps maintain optimal hormone levels for overall health and wellbeing.',
        benefits: [
          'Supports bone health',
          'Supports cardiovascular health',
          'Helps with mood balance',
          'Supports skin and tissue health',
          'May help with hot flashes'
        ],
        tip: 'Take on your scheduled days. Consistency helps maintain stable levels.',
        note: 'Results typically noticed within 4-8 weeks. Labs help optimize dosing.'
      };
    }

    // Progesterone
    if (name.includes('progesterone')) {
      return {
        name: 'Progesterone',
        what: 'Progesterone is a hormone that works with estrogen. It supports sleep, mood, and hormone balance.',
        how: 'Progesterone helps balance other hormones and has calming effects on the brain.',
        benefits: [
          'Supports restful sleep',
          'Helps with mood balance',
          'Balances estrogen effects',
          'Supports bone health',
          'May reduce anxiety'
        ],
        tip: 'Usually taken at BEDTIME because it promotes sleep. Take with or after food.',
        note: 'Many people notice improved sleep within the first week.'
      };
    }

    // Anastrozole
    if (name.includes('anastrozole')) {
      return {
        name: 'Anastrozole',
        what: 'Anastrozole helps control estrogen levels. It is often used alongside testosterone therapy.',
        how: 'This medication blocks the enzyme that converts testosterone to estrogen, helping maintain optimal hormone balance.',
        benefits: [
          'Helps control estrogen levels',
          'Supports testosterone therapy',
          'May reduce water retention',
          'Supports hormone balance'
        ],
        tip: 'Take on your scheduled days. Do not take more than prescribed.',
        note: 'Labs help determine the right dose. Not everyone needs an AI (aromatase inhibitor).'
      };
    }

    // Enclomiphene
    if (name.includes('enclomiphene')) {
      return {
        name: 'Enclomiphene',
        what: 'Enclomiphene helps your body make more testosterone naturally. It stimulates your own production.',
        how: 'It signals your brain to tell your body to produce more testosterone, preserving natural function.',
        benefits: [
          'Supports natural testosterone production',
          'Preserves fertility',
          'May improve energy and mood',
          'Does not shut down natural production'
        ],
        tip: 'Take in the MORNING with or without food.',
        note: 'Labs are checked to monitor response. Works differently than testosterone injections.'
      };
    }

    // DHEA
    if (name.includes('dhea')) {
      return {
        name: 'DHEA',
        what: 'DHEA is a hormone your body makes naturally. It decreases with age and supports many functions.',
        how: 'DHEA is a precursor hormone that your body can convert to other hormones as needed.',
        benefits: [
          'Supports energy levels',
          'May support immune function',
          'Supports hormone balance',
          'May support mood'
        ],
        tip: 'Usually taken in the MORNING. Can be taken with or without food.',
        note: 'Results vary. Labs help determine optimal dosing.'
      };
    }

    // Pregnenolone
    if (name.includes('pregnenolone')) {
      return {
        name: 'Pregnenolone',
        what: 'Pregnenolone is the "mother hormone" that your body uses to make other hormones.',
        how: 'Your body converts pregnenolone into other hormones based on what it needs.',
        benefits: [
          'Supports hormone production',
          'May support memory and focus',
          'Supports stress response',
          'May support mood'
        ],
        tip: 'Usually taken in the MORNING. Can be taken with or without food.',
        note: 'Often used to support overall hormone health.'
      };
    }

    // ===== IV THERAPY =====
    
    // Range IV / General IV
    if (name.includes('range iv') || name.includes('iv') && name.includes('membership')) {
      return {
        name: 'Range IV',
        what: 'Your monthly membership IV delivers vitamins, minerals, and hydration directly to your bloodstream.',
        how: 'IV delivery bypasses digestion for 100% absorption. You feel the effects quickly.',
        benefits: [
          'Immediate hydration',
          'Direct vitamin absorption',
          'Supports energy and recovery',
          'Monthly wellness boost'
        ],
        tip: 'Schedule your monthly IV at a time when you can relax for 30-60 minutes.',
        note: 'Come to your appointment hydrated. Effects are often felt same day.'
      };
    }

    // NAD+ IV
    if (name.includes('nad') && name.includes('iv')) {
      return {
        name: 'NAD+ IV',
        what: 'NAD+ is a molecule every cell needs for energy. IV delivery gives your cells a powerful boost.',
        how: 'NAD+ supports cellular energy production and DNA repair. Levels decline with age.',
        benefits: [
          'Supports cellular energy',
          'May improve mental clarity',
          'Supports healthy aging',
          'May improve recovery'
        ],
        tip: 'NAD+ IVs take 2-4 hours. You may feel flushing during infusion - this is normal.',
        note: 'Many people feel increased energy and clarity after their session.'
      };
    }

    // Myers Cocktail
    if (name.includes('myers')) {
      return {
        name: 'Myers Cocktail IV',
        what: 'The Myers Cocktail is a classic IV formula with B vitamins, vitamin C, magnesium, and calcium.',
        how: 'This combination supports energy, immune function, and overall wellness.',
        benefits: [
          'Supports energy levels',
          'Supports immune function',
          'May help with fatigue',
          'Supports overall wellness'
        ],
        tip: 'Sessions take about 30-45 minutes. Great for regular wellness support.',
        note: 'A popular choice for general health and energy support.'
      };
    }

    // Vitamin C IV
    if (name.includes('vitamin c') && name.includes('iv')) {
      return {
        name: 'Vitamin C IV (High Dose)',
        what: 'High dose vitamin C delivered by IV provides immune and antioxidant support beyond what pills can achieve.',
        how: 'IV delivery allows much higher levels of vitamin C than oral supplements.',
        benefits: [
          'Powerful antioxidant support',
          'Supports immune function',
          'May support skin health',
          'Supports collagen production'
        ],
        tip: 'Sessions take 45-60 minutes. Stay well hydrated before and after.',
        note: 'Higher doses available for specific health goals. Discuss with your provider.'
      };
    }

    // Glutathione IV
    if (name.includes('glutathione')) {
      return {
        name: 'Glutathione IV',
        what: 'Glutathione is your body\'s master antioxidant. It supports detox and skin health.',
        how: 'Glutathione helps neutralize toxins and supports cellular health throughout your body.',
        benefits: [
          'Supports detoxification',
          'May brighten skin',
          'Powerful antioxidant',
          'Supports liver health'
        ],
        tip: 'Can be added to other IVs or given as a push. Quick 10-15 minute add-on.',
        note: 'Popular for skin brightening and detox support.'
      };
    }

    // Default for unknown peptides
    return {
      name: peptideName,
      what: 'This is a peptide therapy chosen for your health goals. Peptides are small proteins that send signals to your cells.',
      how: 'Your provider selected this peptide for your needs. It works by giving your body specific instructions.',
      benefits: [
        'Supports your specific health goals',
        'Works naturally with your body',
        'Chosen based on your needs'
      ],
      tip: 'Follow dosing instructions from your provider. Contact Range Medical with questions.',
      note: 'Results vary. Follow your dosing schedule for best results.'
    };
  };

  const toggleDay = async (day, isCompleted, isOff) => {
    // Don't allow toggling off days
    if (isOff) return;
    
    setSaving(day);
    
    try {
      const res = await fetch(`/api/patient/tracker?token=${token}`, {
        method: isCompleted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day })
      });

      if (res.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error toggling day:', err);
    }
    
    setSaving(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Loading... | Range Medical</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div style={styles.loading}>Loading your protocol...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Error | Range Medical</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div style={styles.errorContainer}>
          <div style={styles.logo}>RANGE MEDICAL</div>
          <div style={styles.errorMessage}>{error}</div>
          <p style={styles.errorHelp}>
            If you need help, text us at (949) 997-3988
          </p>
        </div>
      </div>
    );
  }

  const { protocol, days, dosingInstructions, completionRate } = data;
  
  // Calculate actual injection days (excluding off days)
  const frequency = protocol.doseFrequency;
  const startDate = protocol.startDate;
  const injectionDays = days.filter(d => !isOffDay(d.day, frequency, startDate));
  const completedInjections = days.filter(d => d.completed && !isOffDay(d.day, frequency, startDate)).length;
  const totalInjections = injectionDays.length;
  const adjustedCompletionRate = totalInjections > 0 ? Math.round((completedInjections / totalInjections) * 100) : 0;

  return (
    <div style={styles.container}>
      <Head>
        <title>Injection Tracker | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>RANGE MEDICAL</div>
          <div style={styles.greeting}>Hi {protocol.patientName?.split(' ')[0]}!</div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Protocol Summary Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.protocolName}>{protocol.programName}</div>
            <div style={styles.peptides}>
              {getDisplayName(protocol.primaryPeptide)}
              {protocol.secondaryPeptide && ` + ${protocol.secondaryPeptide}`}
            </div>
            {frequency && (
              <div style={styles.frequency}>{frequency}</div>
            )}
          </div>
          
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{protocol.currentDay > protocol.totalDays ? protocol.totalDays : protocol.currentDay}</div>
              <div style={styles.statLabel}>Day</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{completedInjections}/{totalInjections}</div>
              <div style={styles.statLabel}>Injections</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{adjustedCompletionRate}%</div>
              <div style={styles.statLabel}>Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={styles.progressContainer}>
            <div style={{...styles.progressBar, width: `${adjustedCompletionRate}%`}} />
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabContainer}>
          <button 
            style={{
              ...styles.tabButton,
              ...(activeTab === 'instructions' ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveTab(activeTab === 'instructions' ? null : 'instructions')}
          >
            Dosing Instructions
          </button>
          <button 
            style={{
              ...styles.tabButton,
              ...(activeTab === 'about' ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveTab(activeTab === 'about' ? null : 'about')}
          >
            About Your Peptide
          </button>
        </div>

        {/* Instructions Panel */}
        {activeTab === 'instructions' && (
          <div style={styles.infoPanel}>
            <div style={styles.peptideSection}>
              <h3 style={styles.peptideTitle}>Your Protocol</h3>
              
              <div style={styles.peptideBlock}>
                <div style={styles.peptideLabel}>Peptide{dosingInstructions.peptideList?.length > 1 ? 's' : ''}</div>
                <p style={styles.peptideText}>{dosingInstructions.peptides}</p>
              </div>
              
              <div style={styles.instructionsRow}>
                <div style={styles.instructionsCol}>
                  <div style={styles.peptideLabel}>Dose</div>
                  <p style={styles.peptideText}>{dosingInstructions.dose}</p>
                </div>
                <div style={styles.instructionsCol}>
                  <div style={styles.peptideLabel}>Frequency</div>
                  <p style={styles.peptideText}>{dosingInstructions.frequency}</p>
                </div>
                <div style={styles.instructionsCol}>
                  <div style={styles.peptideLabel}>Duration</div>
                  <p style={styles.peptideText}>{dosingInstructions.duration}</p>
                </div>
              </div>
            </div>
            
            <div style={{...styles.peptideSection, marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e8e8e8'}}>
              <div style={styles.peptideBlock}>
                <div style={styles.peptideLabel}>When to Take</div>
                <p style={{...styles.peptideText, fontWeight: '600', marginBottom: '8px'}}>{dosingInstructions.timing?.when}</p>
                <p style={styles.peptideText}>{dosingInstructions.timing?.instructions}</p>
              </div>
              
              {dosingInstructions.timing?.fasting && (
                <div style={styles.peptideTip}>
                  <div style={styles.tipLabel}>Fasting Required</div>
                  Do not eat for 2 hours before your injection.
                </div>
              )}
              
              {dosingInstructions.timing?.secondaryNote && (
                <div style={styles.peptideNote}>
                  {dosingInstructions.timing.secondaryNote}
                </div>
              )}
            </div>
            
            <div style={{...styles.peptideSection, marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e8e8e8'}}>
              <div style={styles.peptideBlock}>
                <div style={styles.peptideLabel}>
                  How to {dosingInstructions.routeType === 'Oral' ? 'Take' : dosingInstructions.routeType === 'Intranasal' ? 'Use' : 'Inject'}
                </div>
                <p style={{...styles.peptideText, fontWeight: '600', marginBottom: '8px'}}>
                  {dosingInstructions.route?.title} — {dosingInstructions.route?.location}
                </p>
                <ul style={styles.benefitsList}>
                  {dosingInstructions.route?.steps?.map((step, i) => (
                    <li key={i} style={styles.benefitItem}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div style={{...styles.peptideSection, marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e8e8e8'}}>
              <div style={styles.peptideBlock}>
                <div style={styles.peptideLabel}>Storage</div>
                <ul style={styles.benefitsList}>
                  {dosingInstructions.storage?.map((item, i) => (
                    <li key={i} style={styles.benefitItem}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div style={styles.contactBox}>
              <div style={styles.contactLabel}>Questions? Text or call us anytime</div>
              <a href="sms:+19499973988" style={styles.contactPhone}>{dosingInstructions.contact}</a>
            </div>
          </div>
        )}

        {/* About Peptide Panel */}
        {activeTab === 'about' && (
          <div style={styles.infoPanel}>
            {(() => {
              const primaryInfo = getPeptideExplanation(protocol.primaryPeptide);
              const secondaryInfo = protocol.secondaryPeptide ? getPeptideExplanation(protocol.secondaryPeptide) : null;
              
              return (
                <>
                  {primaryInfo && (
                    <div style={styles.peptideSection}>
                      <h3 style={styles.peptideTitle}>{primaryInfo.name}</h3>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>What is it?</div>
                        <p style={styles.peptideText}>{primaryInfo.what}</p>
                      </div>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>How does it work?</div>
                        <p style={styles.peptideText}>{primaryInfo.how}</p>
                      </div>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>Potential Benefits</div>
                        <ul style={styles.benefitsList}>
                          {primaryInfo.benefits.map((benefit, i) => (
                            <li key={i} style={styles.benefitItem}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {primaryInfo.tip && (
                        <div style={styles.peptideTip}>
                          <div style={styles.tipLabel}>Timing Tip</div>
                          {primaryInfo.tip}
                        </div>
                      )}
                      
                      <div style={styles.peptideNote}>
                        {primaryInfo.note}
                      </div>
                    </div>
                  )}
                  
                  {secondaryInfo && secondaryInfo.name !== primaryInfo?.name && (
                    <div style={{...styles.peptideSection, marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0'}}>
                      <h3 style={styles.peptideTitle}>{secondaryInfo.name}</h3>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>What is it?</div>
                        <p style={styles.peptideText}>{secondaryInfo.what}</p>
                      </div>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>How does it work?</div>
                        <p style={styles.peptideText}>{secondaryInfo.how}</p>
                      </div>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>Potential Benefits</div>
                        <ul style={styles.benefitsList}>
                          {secondaryInfo.benefits.map((benefit, i) => (
                            <li key={i} style={styles.benefitItem}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {secondaryInfo.tip && (
                        <div style={styles.peptideTip}>
                          <div style={styles.tipLabel}>Timing Tip</div>
                          {secondaryInfo.tip}
                        </div>
                      )}
                      
                      <div style={styles.peptideNote}>
                        {secondaryInfo.note}
                      </div>
                    </div>
                  )}
                  
                  <div style={styles.disclaimer}>
                    This information is for educational purposes only. It is not medical advice. Always follow your provider's instructions. Contact Range Medical with any questions about your treatment.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Injection Grid */}
        <div style={styles.sectionTitle}>
          Tap each day when you complete your injection
        </div>
        
        {frequency && (frequency.includes('days off') || frequency.includes('weekly') || frequency === 'Every other day') && (
          <div style={styles.offDayLegend}>
            <span style={styles.legendItem}><span style={styles.legendDotGrey}></span> Rest day (no injection)</span>
            <span style={styles.legendItem}><span style={styles.legendDotGreen}></span> Completed</span>
          </div>
        )}

        <div style={styles.daysGrid}>
          {days.map((day) => {
            const isOff = isOffDay(day.day, frequency, startDate);
            return (
              <button
                key={day.day}
                style={{
                  ...styles.dayButton,
                  ...(isOff ? styles.dayOff : {}),
                  ...(day.completed && !isOff ? styles.dayCompleted : {}),
                  ...(day.isCurrent && !day.completed && !isOff ? styles.dayCurrent : {}),
                  ...(day.isFuture && !isOff ? styles.dayFuture : {}),
                  opacity: saving === day.day ? 0.5 : 1,
                  cursor: isOff ? 'default' : 'pointer'
                }}
                onClick={() => toggleDay(day.day, day.completed, isOff)}
                disabled={saving !== null || isOff}
              >
                <div style={{...styles.dayNumber, ...(isOff ? styles.dayNumberOff : {})}}>Day {day.day}</div>
                <div style={{...styles.dayDate, ...(isOff ? styles.dayDateOff : {})}}>
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                {day.completed && !isOff && <div style={styles.checkmark}>✓</div>}
                {isOff && <div style={styles.offLabel}>OFF</div>}
                {day.isCurrent && !day.completed && !isOff && <div style={styles.todayBadge}>TODAY</div>}
              </button>
            );
          })}
        </div>

        {/* Status Message */}
        {protocol.status === 'completed' && (
          <div style={styles.completedMessage}>
            Protocol Complete! Great job staying consistent.
          </div>
        )}

        {protocol.status === 'active' && adjustedCompletionRate === 100 && (
          <div style={styles.completedMessage}>
            All injections logged! You're doing amazing.
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <p>Questions? Text us anytime</p>
          <a href="sms:+19499973988" style={styles.phoneLink}>(949) 997-3988</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fafafa',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#666666',
    fontWeight: '500'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: '16px',
    color: '#000000',
    marginTop: '20px',
    fontWeight: '500'
  },
  errorHelp: {
    fontSize: '14px',
    color: '#666666',
    marginTop: '10px'
  },
  header: {
    backgroundColor: '#000000',
    color: 'white',
    padding: '24px 20px',
    paddingTop: '48px'
  },
  headerInner: {
    maxWidth: '900px',
    margin: '0 auto'
  },
  logo: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    opacity: 0.7
  },
  greeting: {
    fontSize: '28px',
    fontWeight: '600',
    marginTop: '8px',
    letterSpacing: '-0.5px'
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    paddingBottom: '100px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    border: '1px solid #e8e8e8',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  cardHeader: {
    marginBottom: '28px'
  },
  protocolName: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#000000',
    letterSpacing: '-0.3px'
  },
  peptides: {
    fontSize: '15px',
    color: '#555555',
    marginTop: '6px',
    fontWeight: '500'
  },
  frequency: {
    fontSize: '13px',
    color: '#888888',
    marginTop: '4px',
    fontWeight: '500'
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '28px'
  },
  stat: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '-1px'
  },
  statLabel: {
    fontSize: '11px',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginTop: '4px',
    fontWeight: '600'
  },
  progressContainer: {
    height: '10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '5px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: '5px',
    transition: 'width 0.3s ease'
  },
  instructionsButton: {
    display: 'block',
    width: '100%',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#ffffff',
    border: '1.5px solid #000000',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    marginBottom: '20px',
    letterSpacing: '0.3px'
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  tabButton: {
    flex: 1,
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#ffffff',
    border: '1.5px solid #000000',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    letterSpacing: '0.3px'
  },
  tabButtonActive: {
    backgroundColor: '#000000',
    color: '#ffffff'
  },
  infoPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    border: '1px solid #e8e8e8',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  instructionsPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    border: '1px solid #e8e8e8',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  instructionsText: {
    fontSize: '14px',
    lineHeight: '1.9',
    color: '#333333',
    whiteSpace: 'pre-wrap',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    fontWeight: '400'
  },
  instructionsRow: {
    display: 'flex',
    gap: '20px',
    marginTop: '16px'
  },
  instructionsCol: {
    flex: 1
  },
  contactBox: {
    marginTop: '28px',
    paddingTop: '24px',
    borderTop: '1px solid #e8e8e8',
    textAlign: 'center'
  },
  contactLabel: {
    fontSize: '13px',
    color: '#888888',
    marginBottom: '8px',
    fontWeight: '500'
  },
  contactPhone: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#000000',
    textDecoration: 'none',
    letterSpacing: '-0.3px'
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#666666',
    textAlign: 'center',
    marginBottom: '12px',
    fontWeight: '500'
  },
  offDayLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '16px',
    fontSize: '12px',
    color: '#888888',
    fontWeight: '500'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDotGrey: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    backgroundColor: '#e0e0e0'
  },
  legendDotGreen: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    backgroundColor: '#000000'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px'
  },
  dayButton: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1.5px solid #e0e0e0',
    borderRadius: '10px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.15s ease',
    padding: '8px'
  },
  dayCompleted: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    color: 'white'
  },
  dayCurrent: {
    borderColor: '#000000',
    borderWidth: '2px',
    boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.08)'
  },
  dayFuture: {
    opacity: 0.5
  },
  dayOff: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e8e8e8',
    cursor: 'default'
  },
  dayNumber: {
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '-0.2px'
  },
  dayNumberOff: {
    color: '#bbbbbb'
  },
  dayDate: {
    fontSize: '9px',
    marginTop: '2px',
    opacity: 0.7,
    fontWeight: '500'
  },
  dayDateOff: {
    color: '#bbbbbb'
  },
  checkmark: {
    position: 'absolute',
    top: '3px',
    right: '5px',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  offLabel: {
    position: 'absolute',
    bottom: '3px',
    fontSize: '7px',
    fontWeight: '700',
    color: '#bbbbbb',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  todayBadge: {
    position: 'absolute',
    bottom: '3px',
    fontSize: '7px',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  completedMessage: {
    textAlign: 'center',
    fontSize: '15px',
    color: '#000000',
    fontWeight: '600',
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    letterSpacing: '-0.2px'
  },
  peptideSection: {
  },
  peptideTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '20px',
    marginTop: '0',
    letterSpacing: '-0.3px'
  },
  peptideBlock: {
    marginBottom: '20px'
  },
  peptideLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#888888',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px'
  },
  peptideText: {
    fontSize: '14px',
    lineHeight: '1.75',
    color: '#444444',
    margin: '0',
    fontWeight: '400'
  },
  benefitsList: {
    margin: '0',
    paddingLeft: '18px'
  },
  benefitItem: {
    fontSize: '14px',
    lineHeight: '1.9',
    color: '#444444',
    fontWeight: '400'
  },
  peptideNote: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#888888',
    fontStyle: 'italic',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e8e8e8'
  },
  peptideTip: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#000000',
    backgroundColor: '#f8f8f8',
    padding: '16px',
    borderRadius: '10px',
    marginTop: '20px',
    border: '1px solid #e8e8e8'
  },
  tipLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginBottom: '6px'
  },
  disclaimer: {
    fontSize: '11px',
    lineHeight: '1.6',
    color: '#aaaaaa',
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #e8e8e8',
    textAlign: 'center',
    fontWeight: '400'
  },
  footer: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#888888',
    fontSize: '13px',
    fontWeight: '500'
  },
  phoneLink: {
    color: '#000000',
    fontWeight: '600',
    fontSize: '18px',
    textDecoration: 'none',
    letterSpacing: '-0.3px'
  }
};
