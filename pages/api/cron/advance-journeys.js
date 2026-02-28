// /pages/api/cron/advance-journeys.js
// Hourly cron job: evaluate auto-advance conditions for all active journey protocols
// Range Medical System V2

import {
  getProtocolsForEvaluation,
  getTemplateMap,
  evaluateProtocol,
  advanceProtocol,
} from '../../../lib/journey-engine';

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch all active protocols with journey templates
    const protocols = await getProtocolsForEvaluation();

    if (protocols.length === 0) {
      return res.status(200).json({
        success: true,
        evaluated: 0,
        advanced: 0,
        message: 'No active journey protocols to evaluate',
        run_at: new Date().toISOString(),
      });
    }

    // 2. Fetch all templates for lookup
    const templateMap = await getTemplateMap();

    // 3. Evaluate each protocol
    let evaluated = 0;
    let advanced = 0;
    const advances = [];
    const errors = [];

    for (const protocol of protocols) {
      evaluated++;

      const template = templateMap[protocol.journey_template_id];
      if (!template) {
        errors.push(`Protocol ${protocol.id}: template ${protocol.journey_template_id} not found`);
        continue;
      }

      try {
        const nextStage = await evaluateProtocol(protocol, template);

        if (nextStage) {
          const result = await advanceProtocol(
            protocol.id,
            protocol.patient_id,
            nextStage,
            protocol.current_journey_stage,
            `Auto-advanced: conditions met for ${nextStage}`
          );

          if (result.success) {
            advanced++;
            advances.push({
              protocol_id: protocol.id,
              program: protocol.program_name,
              from: protocol.current_journey_stage,
              to: nextStage,
            });
            console.log(
              `Advanced: ${protocol.program_name} (${protocol.id}) ` +
              `${protocol.current_journey_stage} → ${nextStage}`
            );
          } else {
            errors.push(`Protocol ${protocol.id}: advance failed — ${result.error}`);
          }
        }
      } catch (evalErr) {
        console.error(`Error evaluating protocol ${protocol.id}:`, evalErr);
        errors.push(`Protocol ${protocol.id}: ${evalErr.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      evaluated,
      advanced,
      advances: advances.length > 0 ? advances : undefined,
      errors: errors.length > 0 ? errors : undefined,
      run_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('advance-journeys cron error:', error);
    return res.status(500).json({
      error: 'Server error',
      details: error.message,
    });
  }
}
