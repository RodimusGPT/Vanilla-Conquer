import { describe, expect, it } from "vitest";
import {
  TUTORIAL_STEP_IDS,
  createTutorialState,
  getCurrentTutorialStep,
  reconcileTutorialSnapshot,
  tutorialReducer,
  type TutorialAction,
  type TutorialState,
} from "./tutorialModel";

function reduce(state: TutorialState | undefined, action: TutorialAction): TutorialState {
  const next = tutorialReducer(state, action);
  if (!next) throw new Error(`Tutorial action ${action.type} did not create state`);
  return next;
}

function learnBasicControls(state = createTutorialState({ runId: "run-1", tick: 1 })): TutorialState {
  let next = reduce(state, { type: "camera", moved: true });
  next = reduce(next, { type: "camera", zoomed: true });
  next = reduce(next, {
    type: "snapshot",
    facts: { runId: "run-1", tick: 2, selectedFriendlyMobile: true },
  });
  next = reduce(next, { type: "valid-order-sent", runId: "run-1", tick: 2 });
  return reduce(next, { type: "snapshot", facts: { runId: "run-1", tick: 3 } });
}

describe("battlefield tutorial model", () => {
  it("uses stable ordered IDs and explicit lifecycle actions", () => {
    expect(TUTORIAL_STEP_IDS).toEqual([
      "camera_controls",
      "select_unit",
      "issue_order",
      "select_mcv",
      "deploy_mcv",
      "start_power_plant",
      "place_power_plant",
    ]);

    let state = reduce(undefined, { type: "begin", runId: "run-1", tick: 0 });
    expect(getCurrentTutorialStep(state)).toBe("camera_controls");
    state = reduce(state, { type: "minimize" });
    expect(state.minimized).toBe(true);
    state = reduce(state, { type: "resume" });
    expect(state.minimized).toBe(false);

    state = reduce(state, { type: "skip", step: "select_unit" });
    expect(state.outcomes).toEqual({});
    state = reduce(state, { type: "skip" });
    expect(state.outcomes.camera_controls).toBe("skipped");
    expect(getCurrentTutorialStep(state)).toBe("select_unit");

    state = reduce(state, { type: "end" });
    expect(state.status).toBe("dismissed");
    state = reduce(state, { type: "restart", runId: "run-2", tick: 8 });
    expect(state).toMatchObject({
      status: "in-progress",
      outcomes: {},
      camera: { moved: false, zoomed: false },
      timeline: { runId: "run-2", tick: 8 },
    });
  });

  it("requires both camera gestures and a later tick after a valid order", () => {
    let state = createTutorialState({ runId: "run-1", tick: 10 });
    state = reduce(state, { type: "camera", moved: true });
    expect(state.outcomes.camera_controls).toBeUndefined();
    state = reduce(state, { type: "camera", zoomed: true });
    expect(state.outcomes.camera_controls).toBe("verified");

    state = reduce(state, { type: "snapshot", facts: { runId: "run-1", tick: 10, selectedFriendlyMobile: true } });
    expect(state.outcomes.select_unit).toBe("verified");
    state = reduce(state, { type: "valid-order-sent", runId: "run-1", tick: 10 });
    state = reduce(state, { type: "snapshot", facts: { runId: "run-1", tick: 10 } });
    expect(state.outcomes.issue_order).toBeUndefined();
    expect(state.pendingOrder).toEqual({ runId: "run-1", tick: 10 });
    state = reduce(state, { type: "snapshot", facts: { runId: "run-1", tick: 11 } });
    expect(state.outcomes.issue_order).toBe("verified");
    expect(state.pendingOrder).toBeUndefined();
  });

  it("reconciles out-of-order base building facts without fabricating controls", () => {
    let state = createTutorialState({ runId: "run-1", tick: 1 });
    state = reconcileTutorialSnapshot(state, {
      runId: "run-1",
      tick: 40,
      hasFriendlyPowerPlant: true,
    });
    expect(state.outcomes).toEqual({
      select_mcv: "inferred",
      deploy_mcv: "inferred",
      start_power_plant: "inferred",
      place_power_plant: "verified",
    });
    expect(state.outcomes.camera_controls).toBeUndefined();
    expect(state.outcomes.select_unit).toBeUndefined();
    expect(state.outcomes.issue_order).toBeUndefined();
    expect(state.worldEvidence).toEqual({
      select_mcv: { runId: "run-1", tick: 40 },
      deploy_mcv: { runId: "run-1", tick: 40 },
      start_power_plant: { runId: "run-1", tick: 40 },
      place_power_plant: { runId: "run-1", tick: 40 },
    });

    state = reconcileTutorialSnapshot(state, {
      runId: "run-1",
      tick: 41,
      selectedFriendlyMcv: true,
      hasFriendlyPowerPlant: true,
    });
    expect(state.outcomes.select_unit).toBe("verified");
    expect(state.outcomes.select_mcv).toBe("verified");
  });

  it("recognizes Construction Yard availability and every production state", () => {
    let state = createTutorialState();
    state = reconcileTutorialSnapshot(state, { runId: "run-1", tick: 2, powerPlantAvailable: true });
    expect(state.outcomes.select_mcv).toBe("inferred");
    expect(state.outcomes.deploy_mcv).toBe("verified");

    for (const production of ["constructing", "held", "ready"] as const) {
      const reconciled = reconcileTutorialSnapshot(createTutorialState(), {
        runId: "run-1",
        tick: 3,
        powerPlantProduction: production,
      });
      expect(reconciled.outcomes).toMatchObject({
        select_mcv: "inferred",
        deploy_mcv: "inferred",
        start_power_plant: "verified",
      });
    }
  });

  it("invalidates world proof after a save rewind without erasing learned controls", () => {
    let state = learnBasicControls();
    state = reduce(state, {
      type: "snapshot",
      facts: { runId: "run-1", tick: 50, selectedFriendlyMcv: true },
    });
    state = reduce(state, {
      type: "snapshot", facts: { runId: "run-1", tick: 60, powerPlantProduction: "ready" },
    });
    expect(state.status).toBe("in-progress");
    expect(state.outcomes.start_power_plant).toBe("verified");

    state = reduce(state, { type: "timeline-reset", runId: "run-1", tick: 55 });
    expect(state.status).toBe("in-progress");
    expect(state.outcomes.camera_controls).toBe("verified");
    expect(state.outcomes.select_unit).toBe("verified");
    expect(state.outcomes.issue_order).toBe("verified");
    expect(state.outcomes.select_mcv).toBe("verified");
    expect(state.outcomes.deploy_mcv).toBeUndefined();
    expect(state.outcomes.start_power_plant).toBeUndefined();
    expect(state.outcomes.place_power_plant).toBeUndefined();
    expect(getCurrentTutorialStep(state)).toBe("deploy_mcv");
  });

  it("invalidates an inferred MCV selection when a save rewinds before its world proof", () => {
    let state = learnBasicControls();
    state = reduce(state, {
      type: "snapshot",
      facts: { runId: "run-1", tick: 60, hasFriendlyConstructionYard: true },
    });
    expect(state.outcomes.select_mcv).toBe("inferred");
    expect(state.worldEvidence.select_mcv).toEqual({ runId: "run-1", tick: 60 });

    state = reduce(state, { type: "timeline-reset", runId: "run-1", tick: 55 });
    expect(state.outcomes.select_mcv).toBeUndefined();
    expect(state.worldEvidence.select_mcv).toBeUndefined();
    expect(getCurrentTutorialStep(state)).toBe("select_mcv");
  });

  it("upgrades explicit skips when later world proof is available", () => {
    let state = learnBasicControls();
    state = reduce(state, { type: "skip", step: "select_mcv" });
    expect(state.outcomes.select_mcv).toBe("skipped");
    state = reduce(state, {
      type: "snapshot",
      facts: { runId: "run-1", tick: 20, hasFriendlyPowerPlant: true },
    });
    expect(state.status).toBe("completed");
    expect(state.outcomes.select_mcv).toBe("inferred");
    expect(state.outcomes.place_power_plant).toBe("verified");
  });

  it("keeps completed and dismissed terminal states closed across timeline changes", () => {
    let completed = learnBasicControls();
    completed = reduce(completed, {
      type: "snapshot",
      facts: { runId: "run-1", tick: 20, hasFriendlyPowerPlant: true },
    });
    expect(completed.status).toBe("completed");
    completed = reduce(completed, { type: "acknowledge-completion" });
    const afterReset = reduce(completed, { type: "timeline-reset", runId: "run-2", tick: 0 });
    expect(afterReset).toBe(completed);
    expect(reduce(completed, { type: "snapshot", facts: { runId: "run-2", tick: 1 } })).toBe(completed);

    const dismissed = reduce(createTutorialState(), { type: "end" });
    expect(reduce(dismissed, { type: "timeline-reset", runId: "run-2", tick: 0 })).toBe(dismissed);
  });
});
