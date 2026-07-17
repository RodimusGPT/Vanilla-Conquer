import { describe, expect, it, vi } from "vitest";
import { createTutorialState, tutorialReducer, type TutorialState } from "./tutorialModel";
import {
  BATTLEFIELD_TUTORIAL_STORAGE_KEY,
  LEGACY_BATTLEFIELD_ONBOARDING_STORAGE_KEY,
  loadTutorialState,
  saveTutorialState,
  tutorialPersistenceFingerprint,
  validateTutorialState,
} from "./tutorialPersistence";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("battlefield tutorial persistence", () => {
  it("strictly round-trips partial progress including pending and world evidence", () => {
    let state = createTutorialState({ runId: "campaign-run-1", tick: 1 });
    state = tutorialReducer(state, { type: "camera", moved: true }) as TutorialState;
    state = tutorialReducer(state, { type: "valid-order-sent", runId: "campaign-run-1", tick: 4 }) as TutorialState;
    state = tutorialReducer(state, {
      type: "snapshot",
      facts: { runId: "campaign-run-1", tick: 5, hasFriendlyConstructionYard: true },
    }) as TutorialState;
    const storage = memoryStorage();

    expect(saveTutorialState(state, storage)).toBe(true);
    expect(loadTutorialState(storage)).toEqual(state);
    expect(JSON.parse(storage.values.get(BATTLEFIELD_TUTORIAL_STORAGE_KEY) ?? "null")).toEqual(state);
  });

  it("rejects unknown, missing, and semantically contradictory fields", () => {
    const initial = createTutorialState();
    expect(() => validateTutorialState({ ...initial, secret: true })).toThrow("unknown fields");
    expect(() => validateTutorialState({ ...initial, camera: { moved: false, zoomed: false, panned: false } })).toThrow("unknown fields");
    expect(() => validateTutorialState({ ...initial, status: "completed" })).toThrow("unfinished steps");
    expect(() => validateTutorialState({ ...initial, completionAcknowledged: true })).toThrow("out of context");
    expect(() => validateTutorialState({ ...initial, outcomes: { mystery_step: "verified" } })).toThrow("unknown step");
    expect(() => validateTutorialState({
      ...initial,
      outcomes: { deploy_mcv: "skipped" },
      worldEvidence: { deploy_mcv: { runId: "run-1", tick: 2 } },
    })).toThrow("no matching outcome");
    expect(() => validateTutorialState({
      ...initial,
      timeline: { runId: "run-1", tick: 3 },
      outcomes: { deploy_mcv: "verified" },
    })).toThrow("missing world evidence");
    expect(() => validateTutorialState({
      ...initial,
      timeline: { runId: "run-1", tick: 3 },
      outcomes: { deploy_mcv: "verified" },
      worldEvidence: { deploy_mcv: { runId: "run-2", tick: 2 } },
    })).toThrow("does not match the current timeline");
  });

  it("migrates an exact legacy dismissal without removing the legacy key", () => {
    const storage = memoryStorage({ [LEGACY_BATTLEFIELD_ONBOARDING_STORAGE_KEY]: "dismissed" });
    const migrated = loadTutorialState(storage);
    expect(migrated).toEqual({
      version: 2,
      status: "dismissed",
      minimized: false,
      completionAcknowledged: false,
      camera: { moved: false, zoomed: false },
      outcomes: {},
      worldEvidence: {},
    });
    expect(storage.values.get(LEGACY_BATTLEFIELD_ONBOARDING_STORAGE_KEY)).toBe("dismissed");
    expect(JSON.parse(storage.values.get(BATTLEFIELD_TUTORIAL_STORAGE_KEY) ?? "null")).toEqual(migrated);

    expect(loadTutorialState(memoryStorage({ [LEGACY_BATTLEFIELD_ONBOARDING_STORAGE_KEY]: "Dismissed" }))).toBeUndefined();
  });

  it("falls back to legacy dismissal when v2 is corrupt", () => {
    const storage = memoryStorage({
      [BATTLEFIELD_TUTORIAL_STORAGE_KEY]: "{bad json",
      [LEGACY_BATTLEFIELD_ONBOARDING_STORAGE_KEY]: "dismissed",
    });
    expect(loadTutorialState(storage)?.status).toBe("dismissed");
    expect(() => JSON.parse(storage.values.get(BATTLEFIELD_TUTORIAL_STORAGE_KEY) ?? "")).not.toThrow();
  });

  it("treats corrupt or blocked storage as safe in-memory behavior", () => {
    expect(loadTutorialState(memoryStorage({ [BATTLEFIELD_TUTORIAL_STORAGE_KEY]: JSON.stringify({ version: 2 }) }))).toBeUndefined();
    expect(loadTutorialState({ getItem: vi.fn(() => { throw new DOMException("blocked", "SecurityError"); }) })).toBeUndefined();

    const blocked = {
      getItem: () => null,
      setItem: vi.fn(() => { throw new DOMException("blocked", "SecurityError"); }),
    };
    expect(saveTutorialState(createTutorialState(), blocked)).toBe(false);
    expect(blocked.setItem).toHaveBeenCalledOnce();
  });

  it("does not revise persistence for observation-only forward ticks", () => {
    const initial = createTutorialState({ runId: "campaign-run-1", tick: 10 });
    const forward = tutorialReducer(initial, {
      type: "snapshot",
      facts: { runId: "campaign-run-1", tick: 11 },
    }) as TutorialState;
    expect(forward.timeline?.tick).toBe(11);
    expect(tutorialPersistenceFingerprint(forward)).toBe(tutorialPersistenceFingerprint(initial));

    const milestone = tutorialReducer(forward, { type: "camera", moved: true }) as TutorialState;
    expect(tutorialPersistenceFingerprint(milestone)).not.toBe(tutorialPersistenceFingerprint(forward));
  });
});
