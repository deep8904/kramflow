import {
  DEFAULT_TIMER_THRESHOLDS,
  INITIAL_HOLD_STATE,
  INITIAL_TIMER_STATE,
  type DisplayEngineState,
  type DisplayProfile,
} from "./types";

function builtInProfile(
  id: string,
  name: string,
  overrides: Partial<DisplayProfile["layout"]>,
  visibleWidgets: DisplayProfile["visibleWidgets"]
): DisplayProfile {
  return {
    id,
    name,
    builtIn: true,
    layout: {
      fontScale: 1,
      showProgressRing: true,
      showClock: true,
      orientation: "landscape",
      ...overrides,
    },
    visibleWidgets,
    colorOverrides: {},
    refreshMs: 15000,
  };
}

export const BUILT_IN_PROFILES: DisplayProfile[] = [
  builtInProfile(
    "profile-presenter",
    "Presenter Profile",
    { fontScale: 1.4 },
    ["timer", "program-title", "program-subtitle", "next-program", "progress-ring", "messages"]
  ),
  builtInProfile(
    "profile-minimal",
    "Minimal Profile",
    { fontScale: 1.6, showProgressRing: false, showClock: false },
    ["timer"]
  ),
  builtInProfile(
    "profile-av",
    "AV Profile",
    { fontScale: 1 },
    ["timer", "program-title", "next-program", "stage-status", "alerts", "messages", "clock"]
  ),
  builtInProfile(
    "profile-general",
    "General Profile",
    { fontScale: 1.1 },
    ["program-title", "next-program", "session-name", "messages", "clock"]
  ),
  builtInProfile(
    "profile-green-room",
    "Green Room Profile",
    { fontScale: 1.1 },
    ["program-title", "next-program", "speaker", "running-order", "messages", "stage-status", "clock"]
  ),
];

export function createInitialEngineState(): DisplayEngineState {
  const profiles: Record<string, DisplayProfile> = {};
  for (const profile of BUILT_IN_PROFILES) profiles[profile.id] = profile;

  return {
    registry: {},
    groups: {},
    profiles,
    timer: { ...INITIAL_TIMER_STATE, thresholds: { ...DEFAULT_TIMER_THRESHOLDS } },
    hold: { ...INITIAL_HOLD_STATE },
    broadcasts: {
      active: [],
      history: [],
      scheduled: [],
      templates: [],
      favorites: [],
      drafts: [],
    },
    speakerReady: {},
  };
}
