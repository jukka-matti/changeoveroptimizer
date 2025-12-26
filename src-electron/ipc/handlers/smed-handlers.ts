
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

export function registerSmedHandlers() {
    /**
     * SMED: Studies
     */
    registerHandler('smed:get_all_studies', () => getAllStudies(), 'Failed to get studies');
    registerHandler('smed:get_study_by_id', ({ id }: { id: string }) => getStudyById(id), 'Failed to get study');
    registerHandler('smed:create_study', ({ data }: { data: any }) => createStudy(data), 'Failed to create study');
    registerHandler('smed:update_study', ({ id, data }: { id: string; data: any }) => updateStudy(id, data), 'Failed to update study');
    registerHandler('smed:delete_study', ({ id }: { id: string }) => deleteStudy(id), 'Failed to delete study');

    /**
     * SMED: Steps
     */
    registerHandler('smed:get_steps', ({ studyId }: { studyId: string }) => getStepsByStudyId(studyId), 'Failed to get steps');
    registerHandler('smed:create_step', ({ data }: { data: any }) => createStep(data), 'Failed to create step');
    registerHandler('smed:update_step', ({ id, data }: { id: string; data: any }) => updateStep(id, data), 'Failed to update step');
    registerHandler('smed:delete_step', ({ id }: { id: string }) => deleteStep(id), 'Failed to delete step');

    /**
     * SMED: Improvements
     */
    registerHandler('smed:get_improvements', ({ studyId }: { studyId: string }) => getImprovementsByStudyId(studyId), 'Failed to get improvements');
    registerHandler('smed:create_improvement', ({ data }: { data: any }) => createImprovement(data), 'Failed to create improvement');
    registerHandler('smed:update_improvement', ({ id, data }: { id: string; data: any }) => updateImprovement(id, data), 'Failed to update improvement');

    /**
     * SMED: Standards
     */
    registerHandler('smed:get_standards', ({ studyId }: { studyId: string }) => getStandardsByStudyId(studyId), 'Failed to get standards');
    registerHandler('smed:get_active_standard', ({ studyId }: { studyId: string }) => getActiveStandard(studyId), 'Failed to get active standard');
    registerHandler('smed:create_standard', ({ data }: { data: any }) => createStandard(data), 'Failed to create standard');
    registerHandler('smed:update_standard', ({ id, data }: { id: string; data: any }) => updateStandard(id, data), 'Failed to update standard');
    registerHandler('smed:publish_standard', ({ standardId, updateOptimizer }: { standardId: string; updateOptimizer?: boolean }) => publishStandard(standardId, updateOptimizer), 'Failed to publish standard');
    registerHandler('smed:deactivate_standard', ({ standardId }: { standardId: string }) => deactivateStandard(standardId), 'Failed to deactivate standard');

    /**
     * SMED: Logs
     */
    registerHandler('smed:get_logs', ({ studyId, limit }: { studyId: string; limit?: number }) => getLogsByStudyId(studyId, limit), 'Failed to get logs');
    registerHandler('smed:create_log', ({ data }: { data: any }) => createChangeoverLog(data), 'Failed to create log');

    /**
     * SMED: Statistics
     */
    registerHandler('smed:get_statistics', ({ studyId }: { studyId: string }) => getStudyStatistics(studyId), 'Failed to get statistics');
}
