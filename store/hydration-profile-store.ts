"use client";

import { create } from "zustand";

import {
  calculateHydrationTarget,
  draftToAthleteProfile,
  getEffectiveDailyGoal,
  type HydrationCalculationOptions
} from "@/lib/hydration-calculator";
import { createDefaultOnboardingDraft } from "@/lib/hydration-profile-defaults";
import { logHydrationSync, logHydrationSyncError } from "@/lib/hydration-sync-log";
import {
  completeUserOnboarding,
  saveOnboardingDraft,
  saveUserHydrationDocument
} from "@/services/user-hydration-profile-service";
import { useHydrationStore } from "@/store/hydration-store";
import type {
  AthleteHydrationProfile,
  CalculatedHydrationTarget,
  HydrationDayMode,
  OnboardingDraft,
  UserHydrationDocument
} from "@/types/athlete-hydration-profile";
import { ONBOARDING_STEP_COUNT } from "@/types/athlete-hydration-profile";

type ProfileSyncStatus = "idle" | "loading" | "ready" | "error";

type HydrationProfileState = {
  userId: string | null;
  document: UserHydrationDocument | null;
  draft: OnboardingDraft;
  previewTarget: CalculatedHydrationTarget | null;
  isSaving: boolean;
  hasLoaded: boolean;
  syncStatus: ProfileSyncStatus;
  syncError: string | null;
  showOnboarding: boolean;
  setSessionUser: (userId: string | null) => void;
  applyRemoteDocument: (document: UserHydrationDocument | null) => void;
  failRemoteSync: (message: string) => void;
  clearRemoteSync: () => void;
  updateDraft: (partial: Partial<OnboardingDraft>) => void;
  setDraftStep: (step: number) => void;
  autosaveDraft: () => Promise<void>;
  recalculatePreview: () => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setDynamicGoalEnabled: (enabled: boolean) => Promise<void>;
  setManualGoal: (glasses: number) => Promise<void>;
  setActiveDayMode: (mode: HydrationDayMode) => Promise<void>;
  setAthleteModeEnabled: (enabled: boolean) => Promise<void>;
  setWorkoutDayBoost: (liters: number) => Promise<void>;
  saveAthleteProfile: (profile: AthleteHydrationProfile) => Promise<void>;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  effectiveGoal: () => number;
  needsOnboarding: () => boolean;
};

function hydrateDraftFromDocument(document: UserHydrationDocument | null): OnboardingDraft {
  if (!document?.hydrationProfile) {
    return createDefaultOnboardingDraft(document?.onboardingStep ?? 1);
  }

  const { bodyMetrics, activity, climate, lifestyle, performance } =
    document.hydrationProfile;

  return {
    step: document.onboardingStep ?? 1,
    bodyMetrics,
    activity,
    climate,
    lifestyle,
    performance
  };
}

function calculationOptions(
  document: UserHydrationDocument | null
): HydrationCalculationOptions {
  return {
    athleteModeEnabled: document?.athleteModeEnabled ?? false,
    workoutDayBoostLiters: document?.workoutDayBoostLiters
  };
}

function calculateForProfile(
  profile: AthleteHydrationProfile,
  document: UserHydrationDocument | null
) {
  return calculateHydrationTarget(profile, calculationOptions(document));
}

function syncGoalToHydrationStore(document: UserHydrationDocument | null) {
  if (!document) {
    return;
  }

  const goal = getEffectiveDailyGoal(document);
  useHydrationStore.getState().applyEffectiveGoal(goal);
}

export const useHydrationProfileStore = create<HydrationProfileState>()((set, get) => ({
  userId: null,
  document: null,
  draft: createDefaultOnboardingDraft(),
  previewTarget: null,
  isSaving: false,
  hasLoaded: false,
  syncStatus: "idle",
  syncError: null,
  showOnboarding: false,
  setSessionUser: (userId) => {
    if (get().userId === userId) {
      return;
    }

    set({
      userId,
      document: null,
      draft: createDefaultOnboardingDraft(),
      previewTarget: null,
      hasLoaded: false,
      syncStatus: userId ? "loading" : "idle",
      syncError: null,
      showOnboarding: false
    });
  },
  applyRemoteDocument: (document) => {
    const draft = hydrateDraftFromDocument(document);
    const previewTarget = document?.hydrationProfile
      ? calculateForProfile(document.hydrationProfile, document)
      : document?.calculatedHydrationTarget ?? null;

    set({
      document: document
        ? { ...document, calculatedHydrationTarget: previewTarget ?? undefined }
        : null,
      draft,
      previewTarget,
      hasLoaded: true,
      syncStatus: "ready",
      syncError: null,
      showOnboarding: Boolean(document && !document.onboardingCompleted)
    });

    syncGoalToHydrationStore(document);
    logHydrationSync("state", "User hydration profile applied", {
      onboardingCompleted: document?.onboardingCompleted ?? false,
      goal: document ? getEffectiveDailyGoal(document) : null
    });
  },
  failRemoteSync: (message) => {
    logHydrationSyncError("error", "User hydration profile sync failed", message);
    set({ syncStatus: "error", syncError: message, hasLoaded: true });
  },
  clearRemoteSync: () => {
    set({
      userId: null,
      document: null,
      draft: createDefaultOnboardingDraft(),
      previewTarget: null,
      hasLoaded: false,
      syncStatus: "idle",
      syncError: null,
      showOnboarding: false
    });
  },
  updateDraft: (partial) => {
    const nextDraft = {
      ...get().draft,
      ...partial,
      bodyMetrics: { ...get().draft.bodyMetrics, ...partial.bodyMetrics },
      activity: { ...get().draft.activity, ...partial.activity },
      climate: { ...get().draft.climate, ...partial.climate },
      lifestyle: { ...get().draft.lifestyle, ...partial.lifestyle },
      performance: { ...get().draft.performance, ...partial.performance }
    };

    const previewTarget = calculateForProfile(
      draftToAthleteProfile(nextDraft),
      get().document
    );

    set({ draft: nextDraft, previewTarget });
    void get().autosaveDraft();
  },
  setDraftStep: (step) => {
    const safeStep = Math.max(1, Math.min(ONBOARDING_STEP_COUNT, step));
    set({ draft: { ...get().draft, step: safeStep } });
    void get().autosaveDraft();
  },
  autosaveDraft: async () => {
    const userId = get().userId;

    if (!userId) {
      return;
    }

    set({ isSaving: true });

    try {
      await saveOnboardingDraft(userId, get().draft);
      set({ isSaving: false, syncError: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to autosave onboarding.";
      logHydrationSyncError("write", message, error);
      set({ isSaving: false, syncError: message });
    }
  },
  recalculatePreview: () => {
    const profile = draftToAthleteProfile(get().draft);
    set({
      previewTarget: calculateForProfile(profile, get().document)
    });
  },
  completeOnboarding: async () => {
    const userId = get().userId;

    if (!userId) {
      return;
    }

    const profile = draftToAthleteProfile(get().draft);
    const target = calculateForProfile(profile, get().document);
    const dynamicGoalEnabled = get().document?.dynamicGoalEnabled ?? true;

    set({ isSaving: true });

    try {
      await completeUserOnboarding(
        userId,
        profile,
        target,
        target.glassesPerDay,
        dynamicGoalEnabled
      );
      set({
        isSaving: false,
        showOnboarding: false,
        previewTarget: target
      });
      useHydrationStore.getState().applyEffectiveGoal(target.glassesPerDay);
      useHydrationStore.getState().markOnboardingComplete();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete onboarding.";
      set({ isSaving: false, syncError: message });
      throw error;
    }
  },
  resetOnboarding: async () => {
    const userId = get().userId;

    if (!userId) {
      return;
    }

    const draft = createDefaultOnboardingDraft(1);

    set({
      draft,
      showOnboarding: true,
      previewTarget: calculateForProfile(draftToAthleteProfile(draft), get().document)
    });

    await saveUserHydrationDocument(userId, {
      onboardingCompleted: false,
      onboardingStep: 1,
      hydrationProfile: draftToAthleteProfile(draft)
    });
  },
  setDynamicGoalEnabled: async (enabled) => {
    const userId = get().userId;
    const document = get().document;

    if (!userId || !document) {
      return;
    }

    await saveUserHydrationDocument(userId, { dynamicGoalEnabled: enabled });
    const nextDocument = { ...document, dynamicGoalEnabled: enabled };
    set({ document: nextDocument });
    syncGoalToHydrationStore(nextDocument);
  },
  setActiveDayMode: async (mode) => {
    const userId = get().userId;
    const document = get().document;

    if (!userId || !document) {
      return;
    }

    await saveUserHydrationDocument(userId, { activeDayMode: mode });
    const nextDocument = { ...document, activeDayMode: mode };
    set({ document: nextDocument });
    syncGoalToHydrationStore(nextDocument);
  },
  setAthleteModeEnabled: async (enabled) => {
    const userId = get().userId;
    const document = get().document;

    if (!userId || !document?.hydrationProfile) {
      return;
    }

    const target = calculateForProfile(document.hydrationProfile, {
      ...document,
      athleteModeEnabled: enabled
    });

    await saveUserHydrationDocument(userId, {
      athleteModeEnabled: enabled,
      calculatedHydrationTarget: target
    });

    const nextDocument = {
      ...document,
      athleteModeEnabled: enabled,
      calculatedHydrationTarget: target
    };
    set({ document: nextDocument, previewTarget: target });
    syncGoalToHydrationStore(nextDocument);
  },
  setWorkoutDayBoost: async (liters) => {
    const userId = get().userId;
    const document = get().document;

    if (!userId || !document?.hydrationProfile) {
      return;
    }

    const safe = Math.min(1.25, Math.max(0.25, Math.round(liters * 100) / 100));
    const target = calculateForProfile(document.hydrationProfile, {
      ...document,
      workoutDayBoostLiters: safe
    });

    await saveUserHydrationDocument(userId, {
      workoutDayBoostLiters: safe,
      calculatedHydrationTarget: target
    });

    const nextDocument = {
      ...document,
      workoutDayBoostLiters: safe,
      calculatedHydrationTarget: target
    };
    set({ document: nextDocument, previewTarget: target });
    syncGoalToHydrationStore(nextDocument);
  },
  setManualGoal: async (glasses) => {
    const userId = get().userId;
    const document = get().document;

    if (!userId || !document) {
      return;
    }

    const safe = Math.min(24, Math.max(6, Math.round(glasses)));

    await saveUserHydrationDocument(userId, {
      manualGoal: safe,
      dynamicGoalEnabled: false,
      hydrationGoal: safe
    });

    const nextDocument = {
      ...document,
      manualGoal: safe,
      dynamicGoalEnabled: false,
      hydrationGoal: safe
    };
    set({ document: nextDocument });
    syncGoalToHydrationStore(nextDocument);
  },
  saveAthleteProfile: async (profile) => {
    const userId = get().userId;

    if (!userId) {
      return;
    }

    const target = calculateForProfile(profile, get().document);
    const document = get().document;
    const dynamicGoalEnabled = document?.dynamicGoalEnabled ?? true;
    const goal = dynamicGoalEnabled
      ? target.glassesPerDay
      : (document?.manualGoal ?? target.glassesPerDay);

    set({ isSaving: true });

    try {
      await saveUserHydrationDocument(userId, {
        hydrationProfile: profile,
        lifestyleFactors: profile.lifestyle,
        calculatedHydrationTarget: target,
        hydrationGoal: goal
      });
      set({ isSaving: false, previewTarget: target });
      if (document) {
        syncGoalToHydrationStore({
          ...document,
          hydrationProfile: profile,
          calculatedHydrationTarget: target,
          hydrationGoal: goal
        });
      }
    } catch (error) {
      set({ isSaving: false });
      throw error;
    }
  },
  openOnboarding: () => set({ showOnboarding: true }),
  closeOnboarding: () => set({ showOnboarding: false }),
  effectiveGoal: () => {
    const document = get().document;

    if (!document) {
      return 11;
    }

    return getEffectiveDailyGoal(document);
  },
  needsOnboarding: () => {
    const document = get().document;

    if (!document) {
      return false;
    }

    return !document.onboardingCompleted || get().showOnboarding;
  }
}));
