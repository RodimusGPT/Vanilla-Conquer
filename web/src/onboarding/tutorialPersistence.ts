import { validateId } from "../storage/helpers";
import {
  TUTORIAL_STEP_IDS,
  type TutorialState,
  type TutorialStatus,
  type TutorialStepId,
  type TutorialStepOutcome,
  type TutorialTimeline,
  type TutorialWorldStepId,
} from "./tutorialModel";

export const BATTLEFIELD_TUTORIAL_STORAGE_KEY = "cncweb:battlefield-tutorial:v2";
export const LEGACY_BATTLEFIELD_ONBOARDING_STORAGE_KEY = "cncweb:battlefield-onboarding:v1";

type TutorialStorage = Pick<Storage, "getItem"> & Partial<Pick<Storage, "setItem">>;

const STATUSES: readonly TutorialStatus[] = ["in-progress", "completed", "dismissed"];
const OUTCOMES: readonly TutorialStepOutcome[] = ["verified", "inferred", "skipped"];
const WORLD_STEPS: readonly TutorialWorldStepId[] = ["select_mcv", "deploy_mcv", "start_power_plant", "place_power_plant"];

function objectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is invalid`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): void {
  const keys = Object.keys(value);
  if (required.some((key) => !Object.hasOwn(value, key))
    || keys.some((key) => !required.includes(key) && !optional.includes(key))) {
    throw new Error("Tutorial state contains missing or unknown fields");
  }
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} is invalid`);
  return value;
}

function timelineValue(value: unknown, label: string): TutorialTimeline {
  const timeline = objectRecord(value, label);
  exactKeys(timeline, ["runId", "tick"]);
  if (typeof timeline.runId !== "string") throw new Error(`${label} run ID is invalid`);
  validateId(timeline.runId, `${label} run ID`);
  if (!Number.isInteger(timeline.tick) || (timeline.tick as number) < 0 || (timeline.tick as number) > 0xffff_ffff) {
    throw new Error(`${label} tick is invalid`);
  }
  return { runId: timeline.runId, tick: timeline.tick as number };
}

function outcomesValue(value: unknown): TutorialState["outcomes"] {
  const record = objectRecord(value, "Tutorial outcomes");
  if (Object.keys(record).some((step) => !TUTORIAL_STEP_IDS.includes(step as TutorialStepId))) {
    throw new Error("Tutorial outcomes contain an unknown step");
  }
  const outcomes: TutorialState["outcomes"] = {};
  for (const step of TUTORIAL_STEP_IDS) {
    const outcome = record[step];
    if (outcome === undefined) continue;
    if (!OUTCOMES.includes(outcome as TutorialStepOutcome)) throw new Error(`Tutorial outcome for ${step} is invalid`);
    outcomes[step] = outcome as TutorialStepOutcome;
  }
  return outcomes;
}

function worldEvidenceValue(value: unknown, outcomes: TutorialState["outcomes"]): TutorialState["worldEvidence"] {
  const record = objectRecord(value, "Tutorial world evidence");
  if (Object.keys(record).some((step) => !WORLD_STEPS.includes(step as TutorialWorldStepId))) {
    throw new Error("Tutorial world evidence contains an unknown step");
  }
  const result: TutorialState["worldEvidence"] = {};
  for (const step of WORLD_STEPS) {
    const evidence = record[step];
    if (evidence === undefined) continue;
    if (outcomes[step] === undefined || outcomes[step] === "skipped") {
      throw new Error(`Tutorial world evidence for ${step} has no matching outcome`);
    }
    result[step] = timelineValue(evidence, `Tutorial world evidence for ${step}`);
  }
  for (const step of WORLD_STEPS) {
    if (outcomes[step] !== undefined && outcomes[step] !== "skipped" && result[step] === undefined) {
      throw new Error(`Tutorial outcome for ${step} is missing world evidence`);
    }
  }
  return result;
}

/** Strictly parses the complete v2 wire shape and rejects extra fields. */
export function validateTutorialState(value: unknown): TutorialState {
  const state = objectRecord(value, "Tutorial state");
  exactKeys(
    state,
    ["version", "status", "minimized", "completionAcknowledged", "camera", "outcomes", "worldEvidence"],
    ["timeline", "pendingOrder"],
  );
  if (state.version !== 2) throw new Error("Tutorial state version is unsupported");
  if (!STATUSES.includes(state.status as TutorialStatus)) throw new Error("Tutorial status is invalid");
  const status = state.status as TutorialStatus;
  const minimized = booleanValue(state.minimized, "Tutorial minimized marker");
  const completionAcknowledged = booleanValue(state.completionAcknowledged, "Tutorial completion acknowledgement");

  const camera = objectRecord(state.camera, "Tutorial camera evidence");
  exactKeys(camera, ["moved", "zoomed"]);
  const parsedCamera = {
    moved: booleanValue(camera.moved, "Tutorial camera movement evidence"),
    zoomed: booleanValue(camera.zoomed, "Tutorial camera zoom evidence"),
  };
  const outcomes = outcomesValue(state.outcomes);
  const timeline = state.timeline === undefined ? undefined : timelineValue(state.timeline, "Tutorial timeline");
  const worldEvidence = worldEvidenceValue(state.worldEvidence, outcomes);
  const pendingOrder = state.pendingOrder === undefined ? undefined : timelineValue(state.pendingOrder, "Tutorial pending order");

  for (const evidence of Object.values(worldEvidence)) {
    if (!timeline || evidence.runId !== timeline.runId || evidence.tick > timeline.tick) {
      throw new Error("Tutorial world evidence does not match the current timeline");
    }
  }
  if (pendingOrder && (!timeline || pendingOrder.runId !== timeline.runId || pendingOrder.tick > timeline.tick)) {
    throw new Error("Tutorial pending order does not match the current timeline");
  }

  const allStepsFinished = TUTORIAL_STEP_IDS.every((step) => outcomes[step] !== undefined);
  if (status === "completed" && !allStepsFinished) throw new Error("Completed tutorial has unfinished steps");
  if (status === "in-progress" && allStepsFinished) throw new Error("In-progress tutorial has no unfinished steps");
  if (status !== "completed" && completionAcknowledged) throw new Error("Tutorial completion acknowledgement is out of context");
  if (status !== "in-progress" && minimized) throw new Error("Only an in-progress tutorial can be minimized");
  if (status !== "in-progress" && pendingOrder) throw new Error("Tutorial pending order is out of context");
  if (outcomes.issue_order !== undefined && pendingOrder) throw new Error("Tutorial pending order duplicates a finished step");

  return {
    version: 2,
    status,
    minimized,
    completionAcknowledged,
    camera: parsedCamera,
    outcomes,
    worldEvidence,
    ...(timeline ? { timeline } : {}),
    ...(pendingOrder ? { pendingOrder } : {}),
  };
}

function defaultStorage(): TutorialStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function legacyDismissedState(): TutorialState {
  return {
    version: 2,
    status: "dismissed",
    minimized: false,
    completionAcknowledged: false,
    camera: { moved: false, zoomed: false },
    outcomes: {},
    worldEvidence: {},
  };
}

/** Returns `undefined` for a first run, corrupt data, or inaccessible storage. */
export function loadTutorialState(storage: TutorialStorage | undefined = defaultStorage()): TutorialState | undefined {
  if (!storage) return undefined;
  try {
    const encoded = storage.getItem(BATTLEFIELD_TUTORIAL_STORAGE_KEY);
    if (encoded !== null) {
      try {
        return validateTutorialState(JSON.parse(encoded));
      } catch {
        // A valid legacy dismissal still wins over an unusable v2 value so an
        // existing player is not interrupted after an upgrade.
      }
    }
    if (storage.getItem(LEGACY_BATTLEFIELD_ONBOARDING_STORAGE_KEY) !== "dismissed") return undefined;
    const migrated = legacyDismissedState();
    try {
      storage.setItem?.(BATTLEFIELD_TUTORIAL_STORAGE_KEY, JSON.stringify(migrated));
    } catch {
      // Migration is opportunistic; the in-memory dismissal remains valid.
    }
    return migrated;
  } catch {
    return undefined;
  }
}

/** Persists immediately when possible and reports whether storage accepted it. */
export function saveTutorialState(state: TutorialState, storage: TutorialStorage | undefined = defaultStorage()): boolean {
  if (!storage?.setItem) return false;
  try {
    storage.setItem(BATTLEFIELD_TUTORIAL_STORAGE_KEY, JSON.stringify(validateTutorialState(state)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Stable revision for deciding whether persistence has materially changed.
 * Forward simulation ticks are intentionally excluded so observation does not
 * turn into repeated synchronous localStorage writes.
 */
export function tutorialPersistenceFingerprint(state: TutorialState): string {
  const { timeline, ...persistentProgress } = state;
  return JSON.stringify({ ...persistentProgress, timelineRunId: timeline?.runId });
}
