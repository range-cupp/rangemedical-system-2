-- Migration: Add CHECK constraints on status columns
-- Applied: 2026-04-10
-- Purpose: Prevent invalid status values from being written to key tables

-- Protocols: 4 core + 9 lab pipeline statuses
ALTER TABLE protocols
  ADD CONSTRAINT chk_protocols_status CHECK (
    status IN (
      'active', 'completed', 'paused', 'cancelled',
      'merged', 'in_treatment', 'queued',
      'draw_scheduled', 'uploaded', 'ready_to_schedule',
      'follow_up', 'consult_scheduled', 'awaiting_results'
    )
  );

-- Tasks
ALTER TABLE tasks
  ADD CONSTRAINT chk_tasks_status CHECK (
    status IN ('pending', 'completed', 'cancelled')
  );

-- Refill requests
ALTER TABLE refill_requests
  ADD CONSTRAINT chk_refill_requests_status CHECK (
    status IN ('pending', 'approved', 'fulfilled', 'cancelled', 'denied')
  );
