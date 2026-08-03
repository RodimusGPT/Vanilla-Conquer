export const TUTORIAL_STEP_IDS = [
  "camera_controls",
  "select_unit",
  "issue_order",
  "select_mcv",
  "deploy_mcv",
  "start_power_plant",
  "place_power_plant",
] as const;

export type TutorialStepId = (typeof TUTORIAL_STEP_IDS)[number];
export type TutorialStepOutcome = "verified" | "inferred" | "skipped";
export type TutorialStatus = "in-progress" | "completed" | "dismissed";

export interface TutorialTimeline {
  runId: string;
  tick: number;
}

export type TutorialWorldStepId = "select_mcv" | "deploy_mcv" | "start_power_plant" | "place_power_plant";

export interface TutorialState {
  version: 2;
  status: TutorialStatus;
  minimized: boolean;
  completionAcknowledged: boolean;
  camera: {
    moved: boolean;
    zoomed: boolean;
  };
  outcomes: Partial<Record<TutorialStepId, TutorialStepOutcome>>;
  /** Evidence that must be invalidated when a save rewinds or a new run starts. */
  worldEvidence: Partial<Record<TutorialWorldStepId, TutorialTimeline>>;
  /** Most recent simulation point reconciled with the tutorial. */
  timeline?: TutorialTimeline;
  /** A valid contextual command is learned once a later snapshot confirms timeline progress. */
  pendingOrder?: TutorialTimeline;
}

export type PowerPlantProductionState = "none" | "constructing" | "held" | "ready";

/**
 * Small, UI-independent projection of a simulation snapshot. Callers should
 * calculate ownership and object-type checks before dispatching these facts.
 */
export interface TutorialSnapshotFacts extends TutorialTimeline {
  selectedFriendlyMobile?: boolean;
  selectedFriendlyMcv?: boolean;
  hasFriendlyConstructionYard?: boolean;
  powerPlantAvailable?: boolean;
  powerPlantProduction?: PowerPlantProductionState;
  hasFriendlyPowerPlant?: boolean;
}

export type TutorialAction =
  | { type: "begin"; runId?: string; tick?: number }
  | { type: "restart"; runId?: string; tick?: number }
  | { type: "resume" }
  | { type: "minimize" }
  | { type: "end" }
  | { type: "skip"; step?: TutorialStepId }
  | { type: "acknowledge-completion" }
  | { type: "camera"; moved?: boolean; zoomed?: boolean }
  | ({ type: "valid-order-sent" } & TutorialTimeline)
  | { type: "snapshot"; facts: TutorialSnapshotFacts }
  | ({ type: "timeline-reset" } & TutorialTimeline);

const WORLD_STEP_IDS = ["select_mcv", "deploy_mcv", "start_power_plant", "place_power_plant"] as const;

function isTimeline(value: { runId?: string; tick?: number }): value is TutorialTimeline {
  return typeof value.runId === "string"
    && value.runId.length > 0
    && Number.isInteger(value.tick)
    && (value.tick as number) >= 0
    && (value.tick as number) <= 0xffff_ffff;
}

function initialTimeline(runId?: string, tick?: number): TutorialTimeline | undefined {
  const candidate = { runId, tick };
  return isTimeline(candidate) ? { runId: candidate.runId, tick: candidate.tick } : undefined;
}

export function createTutorialState(options: { runId?: string; tick?: number } = {}): TutorialState {
  const timeline = initialTimeline(options.runId, options.tick);
  return {
    version: 2,
    status: "in-progress",
    minimized: false,
    completionAcknowledged: false,
    camera: { moved: false, zoomed: false },
    outcomes: {},
    worldEvidence: {},
    ...(timeline ? { timeline } : {}),
  };
}

export function getCurrentTutorialStep(state: TutorialState | undefined): TutorialStepId | undefined {
  if (!state || state.status !== "in-progress") return undefined;
  return TUTORIAL_STEP_IDS.find((step) => state.outcomes[step] === undefined);
}

export function isTutorialActive(state: TutorialState | undefined): boolean {
  return state?.status === "in-progress";
}

function finishIfComplete(state: TutorialState): TutorialState {
  if (state.status !== "in-progress" || TUTORIAL_STEP_IDS.some((step) => state.outcomes[step] === undefined)) return state;
  return {
    ...state,
    status: "completed",
    minimized: false,
    completionAcknowledged: false,
    pendingOrder: undefined,
  };
}

function shouldReplaceOutcome(current: TutorialStepOutcome | undefined, next: TutorialStepOutcome): boolean {
  if (current === "verified") return false;
  if (current === "skipped") return next !== "skipped";
  return current === undefined || next === "verified";
}

function recordOutcome(
  state: TutorialState,
  step: TutorialStepId,
  outcome: TutorialStepOutcome,
  evidence?: TutorialTimeline,
): TutorialState {
  const current = state.outcomes[step];
  const replacing = shouldReplaceOutcome(current, outcome);
  const worldStep = WORLD_STEP_IDS.includes(step as TutorialWorldStepId) ? step as TutorialWorldStepId : undefined;
  const existingEvidence = worldStep ? state.worldEvidence[worldStep] : undefined;
  const shouldRecordEvidence = Boolean(
    worldStep
    && evidence
    && outcome !== "skipped"
    && (!existingEvidence || existingEvidence.runId !== evidence.runId || evidence.tick < existingEvidence.tick),
  );
  if (!replacing && !shouldRecordEvidence) return state;

  const outcomes = replacing ? { ...state.outcomes, [step]: outcome } : state.outcomes;
  const worldEvidence = shouldRecordEvidence
    ? { ...state.worldEvidence, [worldStep as TutorialWorldStepId]: { ...evidence } }
    : state.worldEvidence;
  return { ...state, outcomes, worldEvidence };
}

function recordCamera(state: TutorialState, action: Extract<TutorialAction, { type: "camera" }>): TutorialState {
  const moved = state.camera.moved || action.moved === true;
  const zoomed = state.camera.zoomed || action.zoomed === true;
  let next = moved === state.camera.moved && zoomed === state.camera.zoomed
    ? state
    : { ...state, camera: { moved, zoomed } };
  if (moved && zoomed) next = recordOutcome(next, "camera_controls", "verified");
  return finishIfComplete(next);
}

function invalidateWorldAfterReset(state: TutorialState, timeline: TutorialTimeline): TutorialState {
  let changed = false;
  const outcomes = { ...state.outcomes };
  const worldEvidence = { ...state.worldEvidence };

  for (const step of WORLD_STEP_IDS) {
    const evidence = worldEvidence[step];
    if (!evidence) continue;
    if (evidence.runId !== timeline.runId || evidence.tick > timeline.tick) {
      delete worldEvidence[step];
      if (outcomes[step] !== "skipped") delete outcomes[step];
      changed = true;
    }
  }

  let pendingOrder = state.pendingOrder;
  if (pendingOrder && (pendingOrder.runId !== timeline.runId || pendingOrder.tick >= timeline.tick)) {
    pendingOrder = undefined;
    changed = true;
  }

  const timelineChanged = state.timeline?.runId !== timeline.runId || state.timeline.tick !== timeline.tick;
  if (!changed && !timelineChanged) return state;
  return {
    ...state,
    ...(changed ? { outcomes, worldEvidence } : {}),
    timeline: { ...timeline },
    pendingOrder,
  };
}

function advanceTimeline(state: TutorialState, timeline: TutorialTimeline): TutorialState {
  const previous = state.timeline;
  if (previous && (previous.runId !== timeline.runId || timeline.tick < previous.tick)) {
    return invalidateWorldAfterReset(state, timeline);
  }
  if (previous?.runId === timeline.runId && previous.tick === timeline.tick) return state;
  return { ...state, timeline: { ...timeline } };
}

export function reconcileTutorialSnapshot(state: TutorialState, facts: TutorialSnapshotFacts): TutorialState {
  if (state.status !== "in-progress" || !isTimeline(facts)) return state;
  const evidence = { runId: facts.runId, tick: facts.tick };
  let next = advanceTimeline(state, evidence);

  if (facts.selectedFriendlyMobile || facts.selectedFriendlyMcv) {
    next = recordOutcome(next, "select_unit", "verified");
  }
  if (facts.selectedFriendlyMcv) {
    next = recordOutcome(next, "select_mcv", "verified", evidence);
  }

  const powerPlantStarted = facts.powerPlantProduction !== undefined && facts.powerPlantProduction !== "none";
  if (facts.hasFriendlyPowerPlant) {
    next = recordOutcome(next, "select_mcv", "inferred", evidence);
    next = recordOutcome(next, "deploy_mcv", "inferred", evidence);
    next = recordOutcome(next, "start_power_plant", "inferred", evidence);
    next = recordOutcome(next, "place_power_plant", "verified", evidence);
  } else if (powerPlantStarted) {
    next = recordOutcome(next, "select_mcv", "inferred", evidence);
    next = recordOutcome(next, "deploy_mcv", "inferred", evidence);
    next = recordOutcome(next, "start_power_plant", "verified", evidence);
  } else if (facts.hasFriendlyConstructionYard || facts.powerPlantAvailable) {
    next = recordOutcome(next, "select_mcv", "inferred", evidence);
    next = recordOutcome(next, "deploy_mcv", "verified", evidence);
  }

  const pending = next.pendingOrder;
  if (pending && pending.runId === facts.runId && facts.tick > pending.tick) {
    next = recordOutcome({ ...next, pendingOrder: undefined }, "issue_order", "verified");
  } else if (pending && (pending.runId !== facts.runId || facts.tick < pending.tick)) {
    next = { ...next, pendingOrder: undefined };
  }

  return finishIfComplete(next);
}

/** Pure reducer; `undefined` represents a player who has never seen the tutorial. */
export function tutorialReducer(state: TutorialState | undefined, action: TutorialAction): TutorialState | undefined {
  if (action.type === "begin") {
    if (!state) return createTutorialState(action);
    return state.status === "in-progress" && state.minimized ? { ...state, minimized: false } : state;
  }
  if (action.type === "restart") return createTutorialState(action);
  if (!state) return state;

  switch (action.type) {
    case "resume":
      return state.status === "in-progress" && state.minimized ? { ...state, minimized: false } : state;
    case "minimize":
      return state.status === "in-progress" && !state.minimized ? { ...state, minimized: true } : state;
    case "end":
      return state.status === "dismissed"
        ? state
        : { ...state, status: "dismissed", minimized: false, completionAcknowledged: false, pendingOrder: undefined };
    case "skip": {
      if (state.status !== "in-progress") return state;
      const current = getCurrentTutorialStep(state);
      if (!current || (action.step !== undefined && action.step !== current)) return state;
      return finishIfComplete(recordOutcome(state, current, "skipped"));
    }
    case "acknowledge-completion":
      return state.status === "completed" && !state.completionAcknowledged
        ? { ...state, completionAcknowledged: true }
        : state;
    case "camera":
      return state.status === "in-progress" ? recordCamera(state, action) : state;
    case "valid-order-sent":
      if (state.status !== "in-progress" || state.outcomes.issue_order !== undefined || !isTimeline(action)) return state;
      return {
        ...advanceTimeline(state, action),
        pendingOrder: { runId: action.runId, tick: action.tick },
      };
    case "snapshot":
      return reconcileTutorialSnapshot(state, action.facts);
    case "timeline-reset":
      return state.status === "in-progress" && isTimeline(action) ? invalidateWorldAfterReset(state, action) : state;
    default:
      return state;
  }
}
