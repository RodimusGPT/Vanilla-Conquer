import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattlefieldOnboarding,
  BattlefieldTutorialCoach,
  type BattlefieldOnboardingProps,
  type TutorialCoachPresentation,
} from "./BattlefieldOnboarding";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("BattlefieldOnboarding", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  function props(overrides: Partial<BattlefieldOnboardingProps> = {}): BattlefieldOnboardingProps {
    return {
      active: true,
      welcomeOpen: false,
      controlsOpen: false,
      tutorialStatus: "In progress · Camera controls",
      onStartTutorial: vi.fn(),
      onHideForNow: vi.fn(),
      onSkipStep: vi.fn(),
      onEndTutorial: vi.fn(),
      onOpenControls: vi.fn(),
      onCloseControls: vi.fn(),
      ...overrides,
    };
  }

  function render(value: BattlefieldOnboardingProps): void {
    act(() => root.render(<BattlefieldOnboarding {...value} />));
  }

  function button(text: string): HTMLButtonElement {
    const match = [...container.querySelectorAll("button")].find((candidate) => candidate.textContent === text);
    if (!(match instanceof HTMLButtonElement)) throw new Error(`Button not found: ${text}`);
    return match;
  }

  function click(target: HTMLElement): void {
    act(() => target.click());
  }

  it("is controlled by the active flag and never reads browser persistence", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    render(props({ active: false }));
    expect(container.innerHTML).toBe("");

    render(props());
    expect(button("Controls").getAttribute("aria-label")).toBe("Open controls and tutorial");
    expect(getItem).not.toHaveBeenCalled();
  });

  it("presents the initial choice as an accessible modal and exposes its dialog ref", () => {
    const welcomeRef = createRef<HTMLElement>();
    const value = props({ welcomeOpen: true, welcomeDialogRef: welcomeRef });
    render(value);

    const dialog = container.querySelector<HTMLElement>("[role='dialog']");
    expect(dialog).toBe(welcomeRef.current);
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-labelledby")).toBe("battlefield-welcome-title");
    expect(dialog?.getAttribute("aria-describedby")).toBe("battlefield-welcome-description");
    expect(dialog?.textContent).toContain("Welcome, Commander");
    expect(dialog?.textContent).toContain("GDI Mission 1");
    expect(document.activeElement).toBe(button("Start tutorial"));

    click(button("Start tutorial"));
    expect(value.onStartTutorial).toHaveBeenCalledOnce();

    act(() => dialog?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(value.onHideForNow).toHaveBeenCalledOnce();
  });

  it("renders dynamic coach content, progress, a viewport target, and all step controls", () => {
    const presentation: TutorialCoachPresentation = {
      chapter: "Battlefield basics",
      step: "Camera controls",
      stepNumber: 1,
      stepCount: 7,
      instruction: "Zoom the battlefield, then move the view.",
      detail: "Use the wheel and middle-button drag.",
      progressText: "Zoom complete · movement remaining",
      targetRect: { left: 100, top: 80, width: 120, height: 48 },
    };
    const value = props({ coach: presentation });
    render(value);

    const coach = container.querySelector<HTMLElement>(".battlefield-tutorial-coach");
    const announcement = container.querySelector<HTMLElement>("[aria-live='polite']");
    const target = container.querySelector<HTMLElement>(".battlefield-tutorial-target");
    const progress = container.querySelector<HTMLProgressElement>("progress");
    expect(coach?.getAttribute("role")).toBe("region");
    expect(announcement?.getAttribute("aria-atomic")).toBe("true");
    expect(announcement?.textContent).toContain("Camera controls");
    expect(announcement?.textContent).toContain("Zoom complete · movement remaining");
    expect(announcement?.textContent).not.toContain("Use the wheel and middle-button drag.");
    expect(coach?.textContent).toContain("Use the wheel and middle-button drag.");
    expect(target?.getAttribute("aria-hidden")).toBe("true");
    expect(target?.style.left).toBe("100px");
    expect(target?.style.width).toBe("120px");
    expect(coach?.dataset.placement).toBe("right");
    expect(progress?.value).toBe(1);
    expect(progress?.max).toBe(7);

    click(button("Skip step"));
    click(button("Hide for now"));
    click(button("End tutorial"));
    expect(value.onSkipStep).toHaveBeenCalledOnce();
    expect(value.onHideForNow).toHaveBeenCalledOnce();
    expect(value.onEndTutorial).toHaveBeenCalledOnce();

    render(props({ coach: { ...presentation, step: "Select a unit", stepNumber: 2, instruction: "Select any friendly mobile unit." } }));
    expect(container.querySelector("[aria-live='polite']")?.textContent).toContain("Select a unit");
    expect(container.querySelector<HTMLProgressElement>("progress")?.value).toBe(2);
  });

  it("offers explicit recovery actions and a compact completion acknowledgement", () => {
    const load = vi.fn();
    const restart = vi.fn();
    const skip = vi.fn();
    const acknowledge = vi.fn();
    const value = props({
      coach: {
        mode: "recovery",
        chapter: "Build a base",
        step: "MCV unavailable",
        instruction: "The Mobile Construction Vehicle cannot be found.",
        recoveryText: "Load a save, restart, or skip the remaining base chapter.",
      },
      onLoadRecovery: load,
      onRestartRecovery: restart,
      onSkipRecovery: skip,
    });
    render(value);

    expect(container.querySelector("[role='alert']")?.textContent).toContain("Load a save");
    click(button("Load"));
    click(button("Restart mission"));
    click(button("Skip remaining base chapter"));
    expect(load).toHaveBeenCalledOnce();
    expect(restart).toHaveBeenCalledOnce();
    expect(skip).toHaveBeenCalledOnce();

    render(props({
      coach: {
        mode: "complete",
        chapter: "Tutorial complete",
        step: "Command is yours",
        instruction: "Review objectives, explore the shroud, and defeat enemy forces.",
      },
      onAcknowledgeCompletion: acknowledge,
    }));
    expect(container.textContent).not.toContain("Skip step");
    click(button("Continue mission"));
    expect(acknowledge).toHaveBeenCalledOnce();
  });

  it("opens a voluntary Controls & tutorial hub with status, actions, and the complete concise reference", () => {
    const launcherRef = createRef<HTMLButtonElement>();
    const dialogRef = createRef<HTMLElement>();
    const resume = vi.fn();
    const restart = vi.fn();
    const value = props({ launcherRef });
    render(value);
    expect(launcherRef.current).toBe(button("Controls"));
    click(button("Controls"));
    expect(value.onOpenControls).toHaveBeenCalledOnce();

    const openValue = props({
      controlsOpen: true,
      launcherRef,
      controlsDialogRef: dialogRef,
      onResumeTutorial: resume,
      onRestartTutorial: restart,
      tutorialStatus: "Hidden · Build a Power Plant (step 6 of 7)",
    });
    render(openValue);

    const dialog = container.querySelector<HTMLElement>("[role='dialog']");
    expect(dialog).toBe(dialogRef.current);
    expect(launcherRef.current?.isConnected).toBe(true);
    expect(launcherRef.current?.hidden).toBe(true);
    expect(dialog?.textContent).toContain("Controls & tutorial");
    expect(dialog?.textContent).toContain("Hidden · Build a Power Plant (step 6 of 7)");
    expect(dialog?.textContent).toContain("unexplored shroud, not a graphics failure");
    expect(dialog?.textContent).toContain("Middle-button drag");
    expect(dialog?.textContent).toContain("W A S D");
    expect(dialog?.textContent).toContain("two-finger drag");
    expect(dialog?.textContent).toContain("Wheel, pinch");
    expect(dialog?.textContent).toContain("Click or tap a unit");
    expect(dialog?.textContent).toContain("Right-click to order");
    expect(dialog?.textContent).toContain("Mobile Construction Vehicle");
    expect(dialog?.textContent).toContain("green footprint");

    click(button("Resume tutorial"));
    click(button("Restart tutorial"));
    click(button("End tutorial"));
    expect(resume).toHaveBeenCalledOnce();
    expect(restart).toHaveBeenCalledOnce();
    expect(openValue.onEndTutorial).toHaveBeenCalledOnce();

    act(() => dialog?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(openValue.onCloseControls).toHaveBeenCalledOnce();
  });

  it("explains a disabled replay and supports controlled fresh-mission confirmation", () => {
    const restart = vi.fn();
    render(props({
      controlsOpen: true,
      onRestartTutorial: restart,
      restartDisabledReason: "Canonical GDI Mission 1 is not installed.",
    }));
    expect(button("Restart tutorial").disabled).toBe(true);
    expect(button("Restart tutorial").getAttribute("aria-describedby")).toBe("battlefield-tutorial-restart-disabled");
    expect(container.textContent).toContain("Canonical GDI Mission 1 is not installed.");

    const confirm = vi.fn();
    const cancel = vi.fn();
    render(props({
      controlsOpen: true,
      confirmRestart: true,
      currentMissionLabel: "GDI Mission 3",
      confirmRestartError: "The fresh tutorial mission could not be started.",
      confirmRestartActionLabel: "Switch without saving",
      onConfirmRestart: confirm,
      onCancelRestart: cancel,
    }));
    const dialog = container.querySelector<HTMLElement>("[role='dialog']");
    expect(dialog?.getAttribute("aria-labelledby")).toBe("battlefield-restart-title");
    expect(dialog?.textContent).toContain("Start a fresh tutorial?");
    expect(dialog?.textContent).toContain("A fresh GDI Mission 1 will replace your current play in GDI Mission 3");
    expect(dialog?.querySelector("[role='alert']")?.textContent).toBe("The fresh tutorial mission could not be started.");
    click(button("Switch without saving"));
    click(button("Cancel"));
    expect(confirm).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });
});

describe("BattlefieldTutorialCoach target validation", () => {
  it("ignores invalid target geometry without hiding the instruction", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    act(() => root.render(<BattlefieldTutorialCoach
      presentation={{
        chapter: "Basics",
        step: "Select a unit",
        instruction: "Select any friendly unit.",
        targetRect: { left: Number.NaN, top: 0, width: 0, height: 10 },
      }}
      onSkipStep={vi.fn()}
      onHide={vi.fn()}
      onEnd={vi.fn()}
    />));
    expect(container.querySelector(".battlefield-tutorial-target")).toBeNull();
    expect(container.textContent).toContain("Select any friendly unit.");
    act(() => root.unmount());
    container.remove();
  });
});
