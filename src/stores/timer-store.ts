import { create } from 'zustand';
import { Step, ChangeoverLog } from '@/types/smed';
import { smedIpc } from '@/lib/electron-ipc';

interface TimerState {
  // Session data
  studyId: string | null;
  steps: Step[];
  currentStepIndex: number;

  // Timer state
  isRunning: boolean;
  isPaused: boolean;
  startedAt: Date | null;
  pausedAt: Date | null;
  totalPausedSeconds: number;

  // Step tracking
  stepStartTimes: Record<string, Date>;
  stepElapsedSeconds: Record<string, number>;
  stepNotes: Record<string, string>;

  // Session metadata
  operator: string | null;

  // Computed getters
  getTotalElapsedSeconds: () => number;
  getCurrentStepElapsedSeconds: () => number;

  // Actions
  startTimer: (studyId: string, steps: Step[], operator?: string) => void;
  pause: () => void;
  resume: () => void;
  nextStep: () => void;
  updateStepNote: (stepId: string, note: string) => void;
  completeTimer: () => Promise<void>;
  cancelTimer: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  // Initial state
  studyId: null,
  steps: [],
  currentStepIndex: 0,
  isRunning: false,
  isPaused: false,
  startedAt: null,
  pausedAt: null,
  totalPausedSeconds: 0,
  stepStartTimes: {},
  stepElapsedSeconds: {},
  stepNotes: {},
  operator: null,

  // Computed getters
  getTotalElapsedSeconds: () => {
    const state = get();
    if (!state.startedAt) return 0;

    const now = state.isPaused && state.pausedAt ? state.pausedAt : new Date();
    const elapsed = Math.floor((now.getTime() - state.startedAt.getTime()) / 1000);
    return elapsed - state.totalPausedSeconds;
  },

  getCurrentStepElapsedSeconds: () => {
    const state = get();
    const currentStep = state.steps[state.currentStepIndex];
    if (!currentStep || !state.stepStartTimes[currentStep.id]) return 0;

    const now = state.isPaused && state.pausedAt ? state.pausedAt : new Date();
    const stepStart = state.stepStartTimes[currentStep.id];
    return Math.floor((now.getTime() - stepStart.getTime()) / 1000);
  },

  // Actions
  startTimer: (studyId: string, steps: Step[], operator?: string) => {
    const now = new Date();
    const firstStep = steps[0];

    set({
      studyId,
      steps,
      currentStepIndex: 0,
      isRunning: true,
      isPaused: false,
      startedAt: now,
      pausedAt: null,
      totalPausedSeconds: 0,
      stepStartTimes: firstStep ? { [firstStep.id]: now } : {},
      stepElapsedSeconds: {},
      stepNotes: {},
      operator: operator || null,
    });
  },

  pause: () => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;

    const now = new Date();
    const currentStep = state.steps[state.currentStepIndex];

    // Save current step's elapsed time
    if (currentStep && state.stepStartTimes[currentStep.id]) {
      const stepElapsed = Math.floor((now.getTime() - state.stepStartTimes[currentStep.id].getTime()) / 1000);
      set((state) => ({
        isPaused: true,
        pausedAt: now,
        stepElapsedSeconds: {
          ...state.stepElapsedSeconds,
          [currentStep.id]: (state.stepElapsedSeconds[currentStep.id] || 0) + stepElapsed,
        },
      }));
    } else {
      set({
        isPaused: true,
        pausedAt: now,
      });
    }
  },

  resume: () => {
    const state = get();
    if (!state.isRunning || !state.isPaused || !state.pausedAt) return;

    const now = new Date();
    const pauseDuration = Math.floor((now.getTime() - state.pausedAt.getTime()) / 1000);
    const currentStep = state.steps[state.currentStepIndex];

    set({
      isPaused: false,
      pausedAt: null,
      totalPausedSeconds: state.totalPausedSeconds + pauseDuration,
      // Reset step start time to account for pause
      stepStartTimes: currentStep
        ? { ...state.stepStartTimes, [currentStep.id]: now }
        : state.stepStartTimes,
    });
  },

  nextStep: () => {
    const state = get();
    if (!state.isRunning || state.currentStepIndex >= state.steps.length - 1) return;

    const now = new Date();
    const currentStep = state.steps[state.currentStepIndex];

    // Save current step's final elapsed time
    if (currentStep && state.stepStartTimes[currentStep.id]) {
      const stepElapsed = state.isPaused
        ? 0 // Already saved in pause
        : Math.floor((now.getTime() - state.stepStartTimes[currentStep.id].getTime()) / 1000);

      const nextStepIndex = state.currentStepIndex + 1;
      const nextStep = state.steps[nextStepIndex];

      set({
        currentStepIndex: nextStepIndex,
        stepElapsedSeconds: {
          ...state.stepElapsedSeconds,
          [currentStep.id]: (state.stepElapsedSeconds[currentStep.id] || 0) + stepElapsed,
        },
        stepStartTimes: nextStep
          ? { ...state.stepStartTimes, [nextStep.id]: now }
          : state.stepStartTimes,
      });
    }
  },

  updateStepNote: (stepId: string, note: string) => {
    set((state) => ({
      stepNotes: {
        ...state.stepNotes,
        [stepId]: note,
      },
    }));
  },

  completeTimer: async () => {
    const state = get();
    if (!state.studyId || !state.startedAt) {
      throw new Error('No active timer session');
    }

    // Save final step's elapsed time
    const currentStep = state.steps[state.currentStepIndex];
    let finalStepElapsedSeconds = { ...state.stepElapsedSeconds };

    if (currentStep && state.stepStartTimes[currentStep.id]) {
      const now = new Date();
      const stepElapsed = state.isPaused
        ? 0
        : Math.floor((now.getTime() - state.stepStartTimes[currentStep.id].getTime()) / 1000);

      finalStepElapsedSeconds = {
        ...finalStepElapsedSeconds,
        [currentStep.id]: (finalStepElapsedSeconds[currentStep.id] || 0) + stepElapsed,
      };
    }

    // Calculate totals
    const totalElapsedSeconds = state.getTotalElapsedSeconds();
    const totalStandardSeconds = state.steps.reduce((sum, step) => sum + step.durationSeconds, 0);
    const varianceSeconds = totalElapsedSeconds - totalStandardSeconds;
    const variancePercent = totalStandardSeconds > 0
      ? ((varianceSeconds / totalStandardSeconds) * 100)
      : 0;

    // Create changeover log - DB expects stepTimingsJson (string) but type uses stepTimings (array)
    try {
      const logData = {
        studyId: state.studyId,
        operator: state.operator || null,
        totalSeconds: totalElapsedSeconds,
        stepTimingsJson: JSON.stringify(
          state.steps.map((step) => ({
            stepId: step.id,
            seconds: finalStepElapsedSeconds[step.id] || 0,
            notes: state.stepNotes[step.id] || null,
          }))
        ),
        varianceSeconds,
        variancePercent,
        startedAt: state.startedAt,
        completedAt: new Date(),
      };
      await smedIpc.createLog(logData as unknown as Partial<ChangeoverLog>);

      // Reset timer
      set({
        studyId: null,
        steps: [],
        currentStepIndex: 0,
        isRunning: false,
        isPaused: false,
        startedAt: null,
        pausedAt: null,
        totalPausedSeconds: 0,
        stepStartTimes: {},
        stepElapsedSeconds: {},
        stepNotes: {},
        operator: null,
      });
    } catch (error) {
      console.error('Failed to save changeover log:', error);
      throw error;
    }
  },

  cancelTimer: () => {
    set({
      studyId: null,
      steps: [],
      currentStepIndex: 0,
      isRunning: false,
      isPaused: false,
      startedAt: null,
      pausedAt: null,
      totalPausedSeconds: 0,
      stepStartTimes: {},
      stepElapsedSeconds: {},
      stepNotes: {},
      operator: null,
    });
  },
}));
