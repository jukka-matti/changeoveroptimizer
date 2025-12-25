/**
 * SMED module IPC handlers
 *
 * Handles: studies, steps, improvements, standards, changeover logs
 */

import { registerHandler } from '../registry';
import {
  getAllStudies,
  getStudyById,
  createStudy,
  updateStudy,
  deleteStudy,
  getStepsByStudyId,
  createStep,
  updateStep,
  deleteStep,
  getImprovementsByStudyId,
  createImprovement,
  updateImprovement,
  getStandardsByStudyId,
  getActiveStandard,
  createStandard,
  updateStandard,
  publishStandard,
  deactivateStandard,
  getLogsByStudyId,
  createChangeoverLog,
  getStudyStatistics,
} from '../../db/queries/smed';

export function registerSmedHandlers(): void {
  // Studies
  registerHandler<void, ReturnType<typeof getAllStudies>>(
    'smed:get_all_studies',
    () => getAllStudies(),
    'Failed to get studies'
  );

  registerHandler<{ id: string }, ReturnType<typeof getStudyById>>(
    'smed:get_study_by_id',
    (args) => getStudyById(args.id),
    'Failed to get study'
  );

  registerHandler<{ data: Parameters<typeof createStudy>[0] }, ReturnType<typeof createStudy>>(
    'smed:create_study',
    (args) => createStudy(args.data),
    'Failed to create study'
  );

  registerHandler<{ id: string; data: Parameters<typeof updateStudy>[1] }, ReturnType<typeof updateStudy>>(
    'smed:update_study',
    (args) => updateStudy(args.id, args.data),
    'Failed to update study'
  );

  registerHandler<{ id: string }, void>(
    'smed:delete_study',
    (args) => deleteStudy(args.id),
    'Failed to delete study'
  );

  // Steps
  registerHandler<{ studyId: string }, ReturnType<typeof getStepsByStudyId>>(
    'smed:get_steps',
    (args) => getStepsByStudyId(args.studyId),
    'Failed to get steps'
  );

  registerHandler<{ data: Parameters<typeof createStep>[0] }, ReturnType<typeof createStep>>(
    'smed:create_step',
    (args) => createStep(args.data),
    'Failed to create step'
  );

  registerHandler<{ id: string; data: Parameters<typeof updateStep>[1] }, ReturnType<typeof updateStep>>(
    'smed:update_step',
    (args) => updateStep(args.id, args.data),
    'Failed to update step'
  );

  registerHandler<{ id: string }, void>(
    'smed:delete_step',
    (args) => deleteStep(args.id),
    'Failed to delete step'
  );

  // Improvements
  registerHandler<{ studyId: string }, ReturnType<typeof getImprovementsByStudyId>>(
    'smed:get_improvements',
    (args) => getImprovementsByStudyId(args.studyId),
    'Failed to get improvements'
  );

  registerHandler<{ data: Parameters<typeof createImprovement>[0] }, ReturnType<typeof createImprovement>>(
    'smed:create_improvement',
    (args) => createImprovement(args.data),
    'Failed to create improvement'
  );

  registerHandler<{ id: string; data: Parameters<typeof updateImprovement>[1] }, ReturnType<typeof updateImprovement>>(
    'smed:update_improvement',
    (args) => updateImprovement(args.id, args.data),
    'Failed to update improvement'
  );

  // Standards
  registerHandler<{ studyId: string }, ReturnType<typeof getStandardsByStudyId>>(
    'smed:get_standards',
    (args) => getStandardsByStudyId(args.studyId),
    'Failed to get standards'
  );

  registerHandler<{ studyId: string }, ReturnType<typeof getActiveStandard>>(
    'smed:get_active_standard',
    (args) => getActiveStandard(args.studyId),
    'Failed to get active standard'
  );

  registerHandler<{ data: Parameters<typeof createStandard>[0] }, ReturnType<typeof createStandard>>(
    'smed:create_standard',
    (args) => createStandard(args.data),
    'Failed to create standard'
  );

  registerHandler<{ id: string; data: Parameters<typeof updateStandard>[1] }, ReturnType<typeof updateStandard>>(
    'smed:update_standard',
    (args) => updateStandard(args.id, args.data),
    'Failed to update standard'
  );

  registerHandler<{ standardId: string }, ReturnType<typeof publishStandard>>(
    'smed:publish_standard',
    (args) => publishStandard(args.standardId),
    'Failed to publish standard'
  );

  registerHandler<{ standardId: string }, ReturnType<typeof deactivateStandard>>(
    'smed:deactivate_standard',
    (args) => deactivateStandard(args.standardId),
    'Failed to deactivate standard'
  );

  // Changeover Logs
  registerHandler<{ studyId: string; limit?: number }, ReturnType<typeof getLogsByStudyId>>(
    'smed:get_logs',
    (args) => getLogsByStudyId(args.studyId, args.limit),
    'Failed to get logs'
  );

  registerHandler<{ data: Parameters<typeof createChangeoverLog>[0] }, ReturnType<typeof createChangeoverLog>>(
    'smed:create_log',
    (args) => createChangeoverLog(args.data),
    'Failed to create changeover log'
  );

  // Statistics
  registerHandler<{ studyId: string }, ReturnType<typeof getStudyStatistics>>(
    'smed:get_statistics',
    (args) => getStudyStatistics(args.studyId),
    'Failed to get study statistics'
  );
}
