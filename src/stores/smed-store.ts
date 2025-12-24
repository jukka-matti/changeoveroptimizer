import { create } from "zustand";
import {
  Study,
  Step,
  Improvement,
  StudyStatistics,
  StudyFormData,
  StepFormData,
  ImprovementFormData,
  StudyStatus,
  ImprovementStatus,
} from "@/types/smed";

export const FREE_STUDY_LIMIT = 3;

interface SmedState {
  // Studies
  studies: Study[];
  currentStudy: Study | null;

  // Steps
  currentSteps: Step[];

  // Improvements
  currentImprovements: Improvement[];

  // Statistics
  currentStatistics: StudyStatistics | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // License enforcement
  canCreateStudy: (tier: "free" | "pro") => boolean;

  // Study operations
  loadStudies: () => Promise<void>;
  loadStudyById: (id: string) => Promise<void>;
  createStudy: (data: StudyFormData) => Promise<Study>;
  updateStudy: (id: string, data: Partial<StudyFormData>) => Promise<void>;
  updateStudyStatus: (id: string, status: StudyStatus) => Promise<void>;
  deleteStudy: (id: string) => Promise<void>;

  // Step operations
  loadSteps: (studyId: string) => Promise<void>;
  createStep: (studyId: string, data: StepFormData) => Promise<Step>;
  updateStep: (id: string, data: Partial<StepFormData>) => Promise<void>;
  deleteStep: (id: string) => Promise<void>;
  reorderSteps: (studyId: string, stepIds: string[]) => Promise<void>;

  // Improvement operations
  loadImprovements: (studyId: string) => Promise<void>;
  createImprovement: (studyId: string, data: ImprovementFormData) => Promise<Improvement>;
  updateImprovement: (id: string, data: Partial<ImprovementFormData>) => Promise<void>;
  updateImprovementStatus: (id: string, status: ImprovementStatus) => Promise<void>;

  // Statistics
  loadStatistics: (studyId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useSmedStore = create<SmedState>((set, get) => ({
  // Initial state
  studies: [],
  currentStudy: null,
  currentSteps: [],
  currentImprovements: [],
  currentStatistics: null,
  isLoading: false,
  error: null,

  // License enforcement
  canCreateStudy: (tier) => {
    if (tier === "pro") return true;
    return get().studies.length < FREE_STUDY_LIMIT;
  },

  // Study operations
  loadStudies: async () => {
    set({ isLoading: true, error: null });
    try {
      const studies = await (window as any).electron.invoke("smed:get_all_studies");
      set({ studies, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load studies",
        isLoading: false
      });
    }
  },

  loadStudyById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const study = await (window as any).electron.invoke("smed:get_study_by_id", id);
      if (!study) {
        throw new Error("Study not found");
      }
      set({ currentStudy: study, isLoading: false });

      // Load related data
      await Promise.all([
        get().loadSteps(id),
        get().loadImprovements(id),
        get().loadStatistics(id),
      ]);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load study",
        isLoading: false
      });
    }
  },

  createStudy: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const study = await (window as any).electron.invoke("smed:create_study", {
        name: data.name,
        description: data.description || null,
        fromProductId: data.fromProductId || null,
        toProductId: data.toProductId || null,
        changeoverType: data.changeoverType || null,
        lineName: data.lineName || null,
        machineName: data.machineName || null,
        status: "draft",
        baselineMinutes: data.baselineMinutes || null,
        targetMinutes: data.targetMinutes || null,
        currentMinutes: null,
      });

      // Reload studies list
      await get().loadStudies();

      set({ isLoading: false });
      return study;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create study",
        isLoading: false
      });
      throw error;
    }
  },

  updateStudy: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.invoke("smed:update_study", id, data);

      // Reload studies and current study
      await get().loadStudies();
      if (get().currentStudy?.id === id) {
        await get().loadStudyById(id);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update study",
        isLoading: false
      });
      throw error;
    }
  },

  updateStudyStatus: async (id, status) => {
    await get().updateStudy(id, { status } as any);
  },

  deleteStudy: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.invoke("smed:delete_study", id);

      // Clear current study if it's the deleted one
      if (get().currentStudy?.id === id) {
        set({
          currentStudy: null,
          currentSteps: [],
          currentImprovements: [],
          currentStatistics: null,
        });
      }

      // Reload studies list
      await get().loadStudies();

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete study",
        isLoading: false
      });
      throw error;
    }
  },

  // Step operations
  loadSteps: async (studyId) => {
    try {
      const steps = await (window as any).electron.invoke("smed:get_steps", studyId);
      set({ currentSteps: steps });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load steps"
      });
    }
  },

  createStep: async (studyId, data) => {
    set({ isLoading: true, error: null });
    try {
      // Calculate sequence number (last + 1)
      const currentSteps = get().currentSteps;
      const sequenceNumber = currentSteps.length > 0
        ? Math.max(...currentSteps.map(s => s.sequenceNumber)) + 1
        : 1;

      const durationSeconds = (data.minutes * 60) + data.seconds;

      const step = await (window as any).electron.invoke("smed:create_step", {
        studyId,
        sequenceNumber,
        description: data.description,
        durationSeconds,
        category: data.category,
        operationType: data.operationType,
        notes: data.notes || null,
        videoTimestamp: data.videoTimestamp || null,
      });

      // Reload steps and statistics
      await Promise.all([
        get().loadSteps(studyId),
        get().loadStatistics(studyId),
      ]);

      // Update current study's currentMinutes
      const stats = get().currentStatistics;
      if (stats) {
        await get().updateStudy(studyId, {
          currentMinutes: stats.totalTimeSeconds / 60,
        } as any);
      }

      set({ isLoading: false });
      return step;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create step",
        isLoading: false
      });
      throw error;
    }
  },

  updateStep: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updateData: any = { ...data };

      // Convert minutes/seconds to durationSeconds if provided
      if (data.minutes !== undefined || data.seconds !== undefined) {
        const minutes = data.minutes ?? 0;
        const seconds = data.seconds ?? 0;
        updateData.durationSeconds = (minutes * 60) + seconds;
        delete updateData.minutes;
        delete updateData.seconds;
      }

      await (window as any).electron.invoke("smed:update_step", id, updateData);

      // Reload steps and statistics
      const studyId = get().currentStudy?.id;
      if (studyId) {
        await Promise.all([
          get().loadSteps(studyId),
          get().loadStatistics(studyId),
        ]);

        // Update current study's currentMinutes
        const stats = get().currentStatistics;
        if (stats) {
          await get().updateStudy(studyId, {
            currentMinutes: stats.totalTimeSeconds / 60,
          } as any);
        }
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update step",
        isLoading: false
      });
      throw error;
    }
  },

  deleteStep: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.invoke("smed:delete_step", id);

      // Reload steps and statistics
      const studyId = get().currentStudy?.id;
      if (studyId) {
        await Promise.all([
          get().loadSteps(studyId),
          get().loadStatistics(studyId),
        ]);

        // Update current study's currentMinutes
        const stats = get().currentStatistics;
        if (stats) {
          await get().updateStudy(studyId, {
            currentMinutes: stats.totalTimeSeconds / 60,
          } as any);
        }
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete step",
        isLoading: false
      });
      throw error;
    }
  },

  reorderSteps: async (studyId, stepIds) => {
    set({ isLoading: true, error: null });
    try {
      // Update sequence numbers for all steps
      for (let i = 0; i < stepIds.length; i++) {
        await (window as any).electron.invoke("smed:update_step", stepIds[i], {
          sequenceNumber: i + 1,
        });
      }

      // Reload steps
      await get().loadSteps(studyId);

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to reorder steps",
        isLoading: false
      });
      throw error;
    }
  },

  // Improvement operations
  loadImprovements: async (studyId) => {
    try {
      const improvements = await (window as any).electron.invoke("smed:get_improvements", studyId);
      set({ currentImprovements: improvements });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load improvements"
      });
    }
  },

  createImprovement: async (studyId, data) => {
    set({ isLoading: true, error: null });
    try {
      const improvement = await (window as any).electron.invoke("smed:create_improvement", {
        studyId,
        description: data.description,
        improvementType: data.improvementType,
        status: "idea",
        estimatedSavingsSeconds: data.estimatedSavingsSeconds || null,
        actualSavingsSeconds: null,
        estimatedCost: data.estimatedCost || null,
        actualCost: null,
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate || null,
        completedDate: null,
        notes: data.notes || null,
      });

      // Reload improvements
      await get().loadImprovements(studyId);

      set({ isLoading: false });
      return improvement;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create improvement",
        isLoading: false
      });
      throw error;
    }
  },

  updateImprovement: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.invoke("smed:update_improvement", id, data);

      // Reload improvements
      const studyId = get().currentStudy?.id;
      if (studyId) {
        await get().loadImprovements(studyId);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update improvement",
        isLoading: false
      });
      throw error;
    }
  },

  updateImprovementStatus: async (id, status) => {
    const updateData: any = { status };

    // Set completedDate if status is 'verified'
    if (status === "verified") {
      updateData.completedDate = new Date();
    }

    await get().updateImprovement(id, updateData);
  },

  // Statistics
  loadStatistics: async (studyId) => {
    try {
      const statistics = await (window as any).electron.invoke("smed:get_statistics", studyId);
      set({ currentStatistics: statistics });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load statistics"
      });
    }
  },

  // Utility
  clearError: () => set({ error: null }),

  reset: () => set({
    studies: [],
    currentStudy: null,
    currentSteps: [],
    currentImprovements: [],
    currentStatistics: null,
    isLoading: false,
    error: null,
  }),
}));
