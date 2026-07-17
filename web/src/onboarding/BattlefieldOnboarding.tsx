import { useEffect, useState, type CSSProperties, type Ref } from "react";
import "./battlefieldOnboarding.css";

/** Viewport coordinates, normally copied from Element.getBoundingClientRect(). */
export interface TutorialTargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type TutorialCoachMode = "step" | "complete" | "recovery";

export interface TutorialCoachPresentation {
  mode?: TutorialCoachMode;
  chapter: string;
  step: string;
  stepNumber?: number;
  stepCount?: number;
  instruction: string;
  detail?: string;
  progressText?: string;
  /** Fixed, viewport-relative coordinates for the element being taught. */
  targetRect?: TutorialTargetRect;
  recoveryText?: string;
}

export interface BattlefieldOnboardingProps {
  active: boolean;
  welcomeOpen: boolean;
  controlsOpen: boolean;
  coach?: TutorialCoachPresentation;
  tutorialStatus: string;
  onStartTutorial: () => void;
  onHideForNow: () => void;
  onSkipStep: () => void;
  onEndTutorial: () => void;
  onOpenControls: () => void;
  onCloseControls: () => void;
  onResumeTutorial?: () => void;
  onRestartTutorial?: () => void;
  restartDisabledReason?: string;
  onLoadRecovery?: () => void;
  onRestartRecovery?: () => void;
  onSkipRecovery?: () => void;
  onAcknowledgeCompletion?: () => void;
  confirmRestart?: boolean;
  currentMissionLabel?: string;
  confirmRestartMessage?: string;
  confirmRestartError?: string;
  confirmRestartActionLabel?: string;
  confirmRestartPending?: boolean;
  onConfirmRestart?: () => void;
  onCancelRestart?: () => void;
  welcomeDialogRef?: Ref<HTMLElement>;
  controlsDialogRef?: Ref<HTMLElement>;
  launcherRef?: Ref<HTMLButtonElement>;
}

interface ViewportSize {
  width: number;
  height: number;
}

interface CoachPosition {
  placement: "left" | "right" | "above" | "below";
  style: CSSProperties;
}

function readViewportSize(): ViewportSize {
  if (typeof window === "undefined") return { width: 1280, height: 720 };
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function useViewportSize(): ViewportSize {
  const [viewport, setViewport] = useState(readViewportSize);

  useEffect(() => {
    const update = (): void => setViewport(readViewportSize());
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return viewport;
}

function validTargetRect(rect: TutorialTargetRect | undefined): rect is TutorialTargetRect {
  return !!rect
    && [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
    && rect.width > 0
    && rect.height > 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function positionCoach(rect: TutorialTargetRect, viewport: ViewportSize): CoachPosition {
  const safe = 12;
  const gap = 14;
  const coachWidth = Math.min(360, Math.max(296, viewport.width - safe * 2));
  const coachHeight = Math.min(300, Math.max(220, viewport.height - safe * 2));
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  const styleAt = (left: number, top: number): CSSProperties => ({
    left,
    top,
    maxHeight: Math.max(44, viewport.height - top - safe),
  });

  if (rect.width >= viewport.width * .7 && rect.height >= viewport.height * .5) {
    const top = clamp(160, safe, viewport.height - coachHeight - safe);
    return {
      placement: "below",
      style: styleAt(clamp(viewport.width / 2 - coachWidth / 2, safe, viewport.width - coachWidth - safe), top),
    };
  }

  if (viewport.width - right - gap >= coachWidth) {
    const top = clamp(rect.top, safe, viewport.height - coachHeight - safe);
    return {
      placement: "right",
      style: styleAt(right + gap, top),
    };
  }
  if (rect.left - gap >= coachWidth + safe) {
    const top = clamp(rect.top, safe, viewport.height - coachHeight - safe);
    return {
      placement: "left",
      style: styleAt(rect.left - coachWidth - gap, top),
    };
  }
  if (viewport.height - bottom - gap >= coachHeight) {
    const top = bottom + gap;
    return {
      placement: "below",
      style: styleAt(clamp(rect.left + rect.width / 2 - coachWidth / 2, safe, viewport.width - coachWidth - safe), top),
    };
  }
  const top = clamp(rect.top - coachHeight - gap, safe, viewport.height - coachHeight - safe);
  return {
    placement: "above",
    style: styleAt(clamp(rect.left + rect.width / 2 - coachWidth / 2, safe, viewport.width - coachWidth - safe), top),
  };
}

function ReferenceGuide() {
  return <div className="battlefield-controls-reference">
    <p className="battlefield-guide-shroud"><strong>Black map?</strong> That is unexplored shroud, not a graphics failure. Explore to reveal it. In the first GDI mission, your revealed start and units are toward the lower right.</p>
    <dl>
      <div>
        <dt>Pan</dt>
        <dd>Middle-button drag, <kbd>W A S D</kbd> or arrow keys; two-finger drag on touch.</dd>
      </div>
      <div>
        <dt>Zoom</dt>
        <dd>Wheel, pinch, the <kbd>+</kbd>/<kbd>−</kbd> buttons, or keyboard.</dd>
      </div>
      <div>
        <dt>Select &amp; order</dt>
        <dd>Click or tap a unit; drag to box-select. Right-click to order, or choose <strong>Order</strong> then tap.</dd>
      </div>
      <div>
        <dt>Build</dt>
        <dd>Select the Mobile Construction Vehicle → <strong>Deploy</strong> → start a structure in the command console → <strong>Place</strong> on a green footprint.</dd>
      </div>
    </dl>
  </div>;
}

export interface BattlefieldWelcomeDialogProps {
  dialogRef?: Ref<HTMLElement>;
  onStart: () => void;
  onHide: () => void;
}

export function BattlefieldWelcomeDialog({ dialogRef, onStart, onHide }: BattlefieldWelcomeDialogProps) {
  return <div className="battlefield-tutorial-backdrop" role="presentation">
    <section
      ref={dialogRef}
      className="battlefield-welcome-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="battlefield-welcome-title"
      aria-describedby="battlefield-welcome-description"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onHide();
      }}
    >
      <p className="battlefield-tutorial-eyebrow">Field orientation</p>
      <h1 id="battlefield-welcome-title">Welcome, Commander</h1>
      <p id="battlefield-welcome-description">Learn the battlefield through a few short actions in GDI Mission 1. Not now dismisses the tutorial, and you can restart it later from Controls.</p>
      <div className="battlefield-tutorial-dialog-actions">
        <button type="button" onClick={onHide}>Not now</button>
        <button type="button" className="primary" autoFocus onClick={onStart}>Start tutorial</button>
      </div>
    </section>
  </div>;
}

export interface BattlefieldTutorialCoachProps {
  presentation: TutorialCoachPresentation;
  onSkipStep: () => void;
  onHide: () => void;
  onEnd: () => void;
  onLoadRecovery?: () => void;
  onRestartRecovery?: () => void;
  onSkipRecovery?: () => void;
  onAcknowledgeCompletion?: () => void;
}

export function BattlefieldTutorialCoach({
  presentation,
  onSkipStep,
  onHide,
  onEnd,
  onLoadRecovery,
  onRestartRecovery,
  onSkipRecovery,
  onAcknowledgeCompletion,
}: BattlefieldTutorialCoachProps) {
  const viewport = useViewportSize();
  const target = validTargetRect(presentation.targetRect) ? presentation.targetRect : undefined;
  const positioned = target ? positionCoach(target, viewport) : undefined;
  const mode = presentation.mode ?? "step";
  const numberedProgress = presentation.stepNumber !== undefined && presentation.stepCount !== undefined
    ? `Step ${presentation.stepNumber} of ${presentation.stepCount}`
    : undefined;
  const progressText = presentation.progressText ?? numberedProgress;
  const boundedProgress = presentation.stepNumber !== undefined && presentation.stepCount !== undefined
    ? clamp(presentation.stepNumber, 0, presentation.stepCount)
    : undefined;

  return <div className="battlefield-tutorial-layer">
    {target && <div
      className="battlefield-tutorial-target"
      aria-hidden="true"
      style={{ left: target.left, top: target.top, width: target.width, height: target.height }}
    />}
    <section
      className={`battlefield-tutorial-coach ${mode}`}
      data-placement={positioned?.placement ?? "default"}
      style={positioned?.style}
      role="region"
      aria-label="Battlefield tutorial"
    >
      <div className="battlefield-tutorial-announcement" aria-live="polite" aria-atomic="true">
        <div className="battlefield-tutorial-heading">
          <p>{presentation.chapter}</p>
          {progressText && <span>{progressText}</span>}
        </div>
        <h2>{presentation.step}</h2>
        <p className="battlefield-tutorial-instruction">{presentation.instruction}</p>
      </div>
      {presentation.detail && <p className="battlefield-tutorial-detail">{presentation.detail}</p>}
      {mode === "recovery" && presentation.recoveryText && <p className="battlefield-tutorial-recovery" role="alert">{presentation.recoveryText}</p>}
      {boundedProgress !== undefined && presentation.stepCount !== undefined && <progress aria-label="Tutorial progress" value={boundedProgress} max={presentation.stepCount} />}
      {mode === "recovery" ? <div className="battlefield-tutorial-coach-actions recovery-actions">
        {onLoadRecovery && <button type="button" className="primary" onClick={onLoadRecovery}>Load</button>}
        {onRestartRecovery && <button type="button" onClick={onRestartRecovery}>Restart mission</button>}
        {onSkipRecovery && <button type="button" onClick={onSkipRecovery}>Skip remaining base chapter</button>}
        <button type="button" onClick={onHide}>Hide for now</button>
        <button type="button" className="danger" onClick={onEnd}>End tutorial</button>
      </div> : mode === "complete" ? <div className="battlefield-tutorial-coach-actions">
        <button type="button" className="primary" onClick={onAcknowledgeCompletion ?? onHide}>Continue mission</button>
      </div> : <div className="battlefield-tutorial-coach-actions">
        <button type="button" onClick={onSkipStep}>Skip step</button>
        <button type="button" onClick={onHide}>Hide for now</button>
        <button type="button" className="danger" onClick={onEnd}>End tutorial</button>
      </div>}
    </section>
  </div>;
}

export interface BattlefieldControlsLauncherProps {
  buttonRef?: Ref<HTMLButtonElement>;
  hidden?: boolean;
  onOpen: () => void;
}

export function BattlefieldControlsLauncher({ buttonRef, hidden, onOpen }: BattlefieldControlsLauncherProps) {
  return <button
    ref={buttonRef}
    type="button"
    className="battlefield-controls-launcher"
    hidden={hidden}
    aria-label="Open controls and tutorial"
    onClick={onOpen}
  >Controls</button>;
}

export interface BattlefieldControlsDialogProps {
  dialogRef?: Ref<HTMLElement>;
  tutorialStatus: string;
  onClose: () => void;
  onStart: () => void;
  onEnd: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  restartDisabledReason?: string;
  confirmRestart?: boolean;
  currentMissionLabel?: string;
  confirmRestartMessage?: string;
  confirmRestartError?: string;
  confirmRestartActionLabel?: string;
  confirmRestartPending?: boolean;
  onConfirmRestart?: () => void;
  onCancelRestart?: () => void;
}

export function BattlefieldControlsDialog({
  dialogRef,
  tutorialStatus,
  onClose,
  onStart,
  onEnd,
  onResume,
  onRestart,
  restartDisabledReason,
  confirmRestart = false,
  currentMissionLabel,
  confirmRestartMessage,
  confirmRestartError,
  confirmRestartActionLabel = "Start fresh mission",
  confirmRestartPending = false,
  onConfirmRestart,
  onCancelRestart,
}: BattlefieldControlsDialogProps) {
  const close = confirmRestart ? (onCancelRestart ?? onClose) : onClose;
  const titleId = confirmRestart ? "battlefield-restart-title" : "battlefield-controls-title";

  return <div
    className="battlefield-tutorial-backdrop"
    role="presentation"
    onPointerDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}
  >
    <section
      ref={dialogRef}
      className="battlefield-controls-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
    >
      {confirmRestart ? <>
        <p className="battlefield-tutorial-eyebrow">Tutorial replay</p>
        <h1 id="battlefield-restart-title">Start a fresh tutorial?</h1>
        <p className="battlefield-restart-warning">{confirmRestartMessage ?? <>A fresh GDI Mission 1 will replace your current play{currentMissionLabel ? <> in <strong>{currentMissionLabel}</strong></> : null}. The current run will no longer be available from Load.</>}</p>
        {confirmRestartError && <p className="battlefield-restart-error" role="alert">{confirmRestartError}</p>}
        <div className="battlefield-tutorial-dialog-actions">
          <button type="button" autoFocus disabled={confirmRestartPending} onClick={onCancelRestart ?? onClose}>Cancel</button>
          <button type="button" className="primary" disabled={confirmRestartPending || !onConfirmRestart} onClick={onConfirmRestart}>{confirmRestartPending ? "Preparing mission…" : confirmRestartActionLabel}</button>
        </div>
      </> : <>
        <button type="button" className="battlefield-tutorial-close" aria-label="Close controls and tutorial" onClick={onClose}>×</button>
        <p className="battlefield-tutorial-eyebrow">Field reference</p>
        <h1 id="battlefield-controls-title">Controls &amp; tutorial</h1>
        <section className="battlefield-tutorial-status" aria-labelledby="battlefield-tutorial-status-title">
          <div>
            <h2 id="battlefield-tutorial-status-title">Tutorial</h2>
            <p role="status">{tutorialStatus}</p>
          </div>
          <div className="battlefield-tutorial-hub-actions">
            {onResume && <button type="button" className="primary" onClick={onResume}>Resume tutorial</button>}
            {!onResume && !onRestart && <button
              type="button"
              className="primary"
              aria-describedby={restartDisabledReason ? "battlefield-tutorial-restart-disabled" : undefined}
              disabled={!!restartDisabledReason}
              onClick={onStart}
            >Start tutorial</button>}
            {onRestart && <button type="button" aria-describedby={restartDisabledReason ? "battlefield-tutorial-restart-disabled" : undefined} disabled={!!restartDisabledReason} onClick={onRestart}>Restart tutorial</button>}
            <button type="button" className="danger" onClick={onEnd}>End tutorial</button>
          </div>
          {restartDisabledReason && <p id="battlefield-tutorial-restart-disabled" className="battlefield-tutorial-disabled-reason">{restartDisabledReason}</p>}
        </section>
        <ReferenceGuide />
      </>}
    </section>
  </div>;
}

/** Controlled onboarding presentation. Game state and persistence stay in App/model. */
export function BattlefieldOnboarding({
  active,
  welcomeOpen,
  controlsOpen,
  coach,
  tutorialStatus,
  onStartTutorial,
  onHideForNow,
  onSkipStep,
  onEndTutorial,
  onOpenControls,
  onCloseControls,
  onResumeTutorial,
  onRestartTutorial,
  restartDisabledReason,
  onLoadRecovery,
  onRestartRecovery,
  onSkipRecovery,
  onAcknowledgeCompletion,
  confirmRestart,
  currentMissionLabel,
  confirmRestartMessage,
  confirmRestartError,
  confirmRestartActionLabel,
  confirmRestartPending,
  onConfirmRestart,
  onCancelRestart,
  welcomeDialogRef,
  controlsDialogRef,
  launcherRef,
}: BattlefieldOnboardingProps) {
  if (!active) return null;

  return <>
    {!welcomeOpen && !controlsOpen && coach && <BattlefieldTutorialCoach
      presentation={coach}
      onSkipStep={onSkipStep}
      onHide={onHideForNow}
      onEnd={onEndTutorial}
      onLoadRecovery={onLoadRecovery}
      onRestartRecovery={onRestartRecovery}
      onSkipRecovery={onSkipRecovery}
      onAcknowledgeCompletion={onAcknowledgeCompletion}
    />}
    {!welcomeOpen && <BattlefieldControlsLauncher buttonRef={launcherRef} hidden={controlsOpen} onOpen={onOpenControls} />}
    {welcomeOpen && <BattlefieldWelcomeDialog dialogRef={welcomeDialogRef} onStart={onStartTutorial} onHide={onHideForNow} />}
    {controlsOpen && <BattlefieldControlsDialog
      dialogRef={controlsDialogRef}
      tutorialStatus={tutorialStatus}
      onClose={onCloseControls}
      onStart={onStartTutorial}
      onEnd={onEndTutorial}
      onResume={onResumeTutorial}
      onRestart={onRestartTutorial}
      restartDisabledReason={restartDisabledReason}
      confirmRestart={confirmRestart}
      currentMissionLabel={currentMissionLabel}
      confirmRestartMessage={confirmRestartMessage}
      confirmRestartError={confirmRestartError}
      confirmRestartActionLabel={confirmRestartActionLabel}
      confirmRestartPending={confirmRestartPending}
      onConfirmRestart={onConfirmRestart}
      onCancelRestart={onCancelRestart}
    />}
  </>;
}
