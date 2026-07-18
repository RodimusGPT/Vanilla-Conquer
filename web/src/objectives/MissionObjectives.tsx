import type { RuntimeMissionV1 } from "../simulation/runtimeCatalog";
import type { SnapshotSidebar } from "../simulation/snapshot";
import "./missionObjectives.css";

export type MissionObjectiveStatus = "active" | "complete" | "failed";

export interface MissionObjectiveResult {
  won: boolean;
}

export interface MissionObjectiveItem {
  id: string;
  label: string;
  description: string;
  progress: string;
  status: MissionObjectiveStatus;
}

export interface MissionObjectivePresentation {
  title: string;
  status: MissionObjectiveStatus;
  items: readonly MissionObjectiveItem[];
}

const [
  OPERATION_ORDERS,
  ELIMINATE_NOD_ID,
  PRESERVE_GDI_ID,
  ELIMINATE_NOD_FORCE,
  KEEP_GDI_OPERATIONAL,
  GDI_FORCE_SURVIVED,
  ENGINE_OPERATION_FAILED,
  ALL_GDI_UNITS_AND_STRUCTURES_LOST,
] = [
  "Operation orders",
  "eliminate-nod",
  "preserve-gdi",
  "Eliminate the Nod force",
  "Keep GDI operational",
  "GDI force survived",
  "Engine-confirmed operation failed",
  "All counted GDI units and structures were lost",
] as const;

function objectiveItem(
  status: MissionObjectiveStatus,
  id: string,
  label: string,
  description: string,
  progress: string,
): MissionObjectiveItem {
  return { id, label, description, progress, status };
}

function operationOrders(
  status: MissionObjectiveStatus,
  items: readonly MissionObjectiveItem[],
): MissionObjectivePresentation {
  return { title: OPERATION_ORDERS, status, items };
}

type MissionFour = "4-west-a" | "4-west-b" | "4-east-a";
type MissionFive = "5-east-a" | "5-west-a" | "5-west-b";
type MissionEight = "8-east-a" | "8-east-b";
type ReviewedGdiMission = 1 | 2 | 3 | 6 | 7 | MissionFour | MissionFive | MissionEight;

function reviewedGdiMission(mission: RuntimeMissionV1): ReviewedGdiMission | undefined {
  if (mission.faction !== "gdi") return undefined;
  if (mission.direction === 0 && mission.variation === 0) {
    if (mission.id === "gdi-01-east-a" && mission.scenarioRoot === "SCG01EA" && mission.scenario === 1 && mission.buildLevel === 1) return 1;
    if (mission.id === "gdi-02-east-a" && mission.scenarioRoot === "SCG02EA" && mission.scenario === 2 && mission.buildLevel === 2) return 2;
    if (mission.id === "gdi-03-east-a" && mission.scenarioRoot === "SCG03EA" && mission.scenario === 3 && mission.buildLevel === 3) return 3;
    if (mission.id === "gdi-06-east-a" && mission.scenarioRoot === "SCG06EA" && mission.scenario === 6 && mission.buildLevel === 6) return 6;
    if (mission.id === "gdi-07-east-a" && mission.scenarioRoot === "SCG07EA" && mission.scenario === 7 && mission.buildLevel === 7) return 7;
  }
  if (
    mission.id === "gdi-04-west-a"
    && mission.scenarioRoot === "SCG04WA"
    && mission.scenario === 4
    && mission.variation === 0
    && mission.direction === 1
    && mission.buildLevel === 4
  ) return "4-west-a";
  if (
    mission.id === "gdi-04-west-b"
    && mission.scenarioRoot === "SCG04WB"
    && mission.scenario === 4
    && mission.variation === 1
    && mission.direction === 1
    && mission.buildLevel === 4
  ) return "4-west-b";
  if (
    mission.id === "gdi-04-east-a"
    && mission.scenarioRoot === "SCG04EA"
    && mission.scenario === 4
    && mission.variation === 0
    && mission.direction === 0
    && mission.buildLevel === 4
  ) return "4-east-a";
  if (
    mission.id === "gdi-05-east-a"
    && mission.scenarioRoot === "SCG05EA"
    && mission.scenario === 5
    && mission.variation === 0
    && mission.direction === 0
    && mission.buildLevel === 5
  ) return "5-east-a";
  if (
    mission.id === "gdi-05-west-a"
    && mission.scenarioRoot === "SCG05WA"
    && mission.scenario === 5
    && mission.variation === 0
    && mission.direction === 1
    && mission.buildLevel === 5
  ) return "5-west-a";
  if (
    mission.id === "gdi-05-west-b"
    && mission.scenarioRoot === "SCG05WB"
    && mission.scenario === 5
    && mission.variation === 1
    && mission.direction === 1
    && mission.buildLevel === 5
  ) return "5-west-b";
  if (mission.scenario === 8 && mission.direction === 0 && mission.buildLevel === 8) {
    if (mission.id === "gdi-08-east-a" && mission.scenarioRoot === "SCG08EA" && mission.variation === 0) return "8-east-a";
    if (mission.id === "gdi-08-east-b" && mission.scenarioRoot === "SCG08EB" && mission.variation === 1) return "8-east-b";
  }
  return undefined;
}

function resultStatus(result: MissionObjectiveResult | undefined): MissionObjectiveStatus {
  if (!result) return "active";
  return result.won ? "complete" : "failed";
}

function destroyedProgress(stats: SnapshotSidebar | undefined, result: MissionObjectiveResult | undefined): string {
  if (result?.won) return "Engine-confirmed objective complete";
  const units = stats?.unitsKilled ?? 0;
  const structures = stats?.buildingsKilled ?? 0;
  return `${units.toLocaleString()} ${units === 1 ? "unit" : "units"} and ${structures.toLocaleString()} ${structures === 1 ? "structure" : "structures"} destroyed`;
}

function survivalProgress(
  stats: SnapshotSidebar | undefined,
  result: MissionObjectiveResult | undefined,
  failed = "All counted GDI ground forces were lost",
): string {
  if (result?.won) return GDI_FORCE_SURVIVED;
  if (result && !result.won) return failed;
  const losses = (stats?.unitsLost ?? 0) + (stats?.buildingsLost ?? 0);
  return `${losses.toLocaleString()} ${losses === 1 ? "loss" : "losses"} recorded`;
}

function engineRuleProgress(
  result: MissionObjectiveResult | undefined,
  active: string,
  complete = "Engine-confirmed objective complete",
): string {
  if (!result) return active;
  return result.won ? complete : ENGINE_OPERATION_FAILED;
}

function missionFourPresentation(
  mission: MissionFour,
  result: MissionObjectiveResult | undefined,
): MissionObjectivePresentation {
  const status = resultStatus(result);
  if (mission === "4-west-b") {
    return operationOrders(status, [
      objectiveItem(
        status,
        ELIMINATE_NOD_ID,
        ELIMINATE_NOD_FORCE,
        "Destroy every counted Nod unit in the operation area. Triggered Nod assault groups become additional targets.",
        engineRuleProgress(result, "Nod elimination objective active"),
      ),
      objectiveItem(
        status,
        "preserve-village",
        "Preserve the protected village",
        "The operation fails if all four protected village structures are destroyed.",
        engineRuleProgress(result, "Village protection condition active", "Engine-confirmed protection condition satisfied"),
      ),
      objectiveItem(
        status,
        PRESERVE_GDI_ID,
        KEEP_GDI_OPERATIONAL,
        "The operation fails if every counted GDI infantry unit and ground vehicle is destroyed.",
        engineRuleProgress(result, "GDI survival condition active", GDI_FORCE_SURVIVED),
      ),
    ]);
  }
  return operationOrders(status, [
    objectiveItem(
      status,
      "recover-crate",
      "Recover the GDI crate",
      "Reach the marked recovery area. The operation completes when a GDI unit enters the crate cell; destroying Nod is not required.",
      engineRuleProgress(result, "Crate recovery objective active"),
    ),
    objectiveItem(
      status,
      PRESERVE_GDI_ID,
      "Keep the recovery force operational",
      "The operation fails if every counted GDI infantry unit and ground vehicle is destroyed. A transport aircraft alone does not prevent defeat.",
      engineRuleProgress(result, "Recovery force condition active", "GDI recovery force survived"),
    ),
  ]);
}

function missionFivePresentation(
  result: MissionObjectiveResult | undefined,
  stats: SnapshotSidebar | undefined,
): MissionObjectivePresentation {
  const status = resultStatus(result);
  return operationOrders(status, [
    objectiveItem(
      status,
      ELIMINATE_NOD_ID,
      ELIMINATE_NOD_FORCE,
      "Destroy every counted Nod unit and structure in the operation area. Nod production, rebuilt structures, patrols, and timed attack teams can add targets.",
      destroyedProgress(stats, result),
    ),
    objectiveItem(
      status,
      "relieve-base",
      "Relieve the separated GDI base",
      "Move GDI units through both authored relief zones. Until each zone is crossed, losing the last member of its protected starting group—field force or base structures—immediately fails the operation.",
      engineRuleProgress(result, "Base-relief conditions active", "Engine-confirmed relief conditions satisfied"),
    ),
    objectiveItem(
      status,
      PRESERVE_GDI_ID,
      KEEP_GDI_OPERATIONAL,
      "The operation also fails if every counted GDI unit and structure is destroyed.",
      engineRuleProgress(result, "GDI survival condition active", GDI_FORCE_SURVIVED),
    ),
  ]);
}

function missionSixPresentation(
  result: MissionObjectiveResult | undefined,
): MissionObjectivePresentation {
  const status = resultStatus(result);
  return operationOrders(status, [
    objectiveItem(
      status,
      "sabotage-nod",
      "Sabotage the Nod base",
      "Use the Commando's C4 to demolish the Airstrip, Construction Yard, Hand of Nod, Refinery, Silo, Power Plant, or Communications Center. Destroying every counted Nod unit and structure is an alternate victory. Sabotaging the Airstrip bypasses Mission 7; otherwise the sabotaged structure type is carried into Mission 7.",
      engineRuleProgress(result, "C4 sabotage objective active"),
    ),
    objectiveItem(
      status,
      "preserve-commando",
      "Keep the Commando alive",
      "The operation fails if the Commando is killed. Landing craft and transport aircraft alone do not keep the GDI ground force operational.",
      engineRuleProgress(result, "Commando survival condition active", "Commando survived"),
    ),
  ]);
}

function missionSevenPresentation(
  result: MissionObjectiveResult | undefined,
  stats: SnapshotSidebar | undefined,
): MissionObjectivePresentation {
  const status = resultStatus(result);
  return operationOrders(status, [
    objectiveItem(
      status,
      ELIMINATE_NOD_ID,
      "Eliminate the remaining Nod force",
      "Landing-craft reinforcements culminate in an MCV; use it to build up a base, then remove every counted unit and structure from Nod control. Destroy units; destroy or capture structures. Nod production, rebuilt structures, timed attack teams, and later autocreated teams can add targets.",
      result && !result.won ? ENGINE_OPERATION_FAILED : destroyedProgress(stats, result),
    ),
    objectiveItem(
      status,
      PRESERVE_GDI_ID,
      KEEP_GDI_OPERATIONAL,
      "The operation fails if every counted GDI infantry unit, ground unit, structure, and regular aircraft is destroyed. Landing craft, transport/cargo aircraft, and A-10 strike aircraft alone do not prevent defeat.",
      survivalProgress(stats, result, ALL_GDI_UNITS_AND_STRUCTURES_LOST),
    ),
  ]);
}

function missionEightPresentation(
  mission: MissionEight,
  result: MissionObjectiveResult | undefined,
  stats: SnapshotSidebar | undefined,
): MissionObjectivePresentation {
  const status = resultStatus(result);
  const eliminateNod = objectiveItem(
    status,
    ELIMINATE_NOD_ID,
    ELIMINATE_NOD_FORCE,
    mission === "8-east-a"
      ? "Remove every counted unit and structure from Nod control. Destroy units; destroy or capture structures. Production can add targets."
      : "Remove every counted unit and structure from Nod control. Destroy units; destroy or capture structures. Production and transport reinforcements can add targets.",
    result && !result.won
      ? ENGINE_OPERATION_FAILED
      : destroyedProgress(stats, result),
  );
  if (mission === "8-east-a") {
    return operationOrders(status, [
      eliminateNod,
      objectiveItem(
        status,
        PRESERVE_GDI_ID,
        KEEP_GDI_OPERATIONAL,
        "Repairing the damaged opening force is advised; lose if no counted GDI unit or structure remains.",
        survivalProgress(stats, result, ALL_GDI_UNITS_AND_STRUCTURES_LOST),
      ),
    ]);
  }
  return operationOrders(status, [
    eliminateNod,
    objectiveItem(
      status,
      "protect-moebius",
      "Protect Dr. Moebius and the hospital",
      "Dr. Moebius and the hospital must survive; losing either fails.",
      engineRuleProgress(result, "Both protected", "Both survived"),
    ),
    objectiveItem(
      status,
      "protect-civilians",
      "Limit civilian casualties",
      "The ninth death among 14 neutral civilians fails; at most eight may be lost.",
      engineRuleProgress(result, "Limit active", "Limit satisfied"),
    ),
    objectiveItem(
      status,
      PRESERVE_GDI_ID,
      KEEP_GDI_OPERATIONAL,
      "Also lose if no counted GDI unit or structure remains.",
      engineRuleProgress(result, "GDI active", GDI_FORCE_SURVIVED),
    ),
  ]);
}

/**
 * Returns mission rules only when the browser has an exact, reviewed rule set.
 * Final status always comes from the engine result; snapshot statistics are
 * progress context and are never treated as proof of victory.
 */
export function missionObjectivePresentation(
  mission: RuntimeMissionV1,
  stats: SnapshotSidebar | undefined,
  result: MissionObjectiveResult | undefined,
): MissionObjectivePresentation | undefined {
  const reviewedMission = reviewedGdiMission(mission);
  if (!reviewedMission) return undefined;
  if (typeof reviewedMission === "string") {
    if (reviewedMission.startsWith("4-")) return missionFourPresentation(reviewedMission as MissionFour, result);
    if (reviewedMission.startsWith("5-")) return missionFivePresentation(result, stats);
    return missionEightPresentation(reviewedMission as MissionEight, result, stats);
  }
  if (reviewedMission === 6) return missionSixPresentation(result);
  if (reviewedMission === 7) return missionSevenPresentation(result, stats);
  const status = resultStatus(result);
  const missionTwo = reviewedMission === 2;
  const missionThree = reviewedMission === 3;
  return operationOrders(status, [
    objectiveItem(
      status,
      ELIMINATE_NOD_ID,
      missionTwo ? "Eliminate the Nod occupation" : ELIMINATE_NOD_FORCE,
      missionThree
          ? "Destroy every counted Nod unit and structure in the operation area. Nod production, rebuilt structures, and attack teams can add targets."
          : missionTwo
            ? "Destroy every Nod unit and structure in the occupied region. Attack teams and field reinforcements may change the force count."
            : "Destroy the Nod units and structures assigned to this operation. Reinforcements may enter the battlefield.",
      destroyedProgress(stats, result),
    ),
    objectiveItem(
      status,
      PRESERVE_GDI_ID,
      missionThree
          ? KEEP_GDI_OPERATIONAL
          : missionTwo
            ? "Keep a GDI force operational"
            : "Keep a GDI ground force operational",
      missionThree
          ? "The operation fails if no counted GDI structure, infantry, or ground vehicle remains."
          : missionTwo
            ? "The operation fails if every counted GDI unit and structure is destroyed."
            : "The operation fails if every counted GDI ground force is destroyed.",
      survivalProgress(
        stats,
        result,
        missionTwo || missionThree
          ? ALL_GDI_UNITS_AND_STRUCTURES_LOST
          : "All counted GDI ground forces were lost",
      ),
    ),
  ]);
}

function statusLabel(status: MissionObjectiveStatus): string {
  if (status === "complete") return "Complete";
  if (status === "failed") return "Failed";
  return "In progress";
}

export interface MissionObjectivesProps {
  mission: RuntimeMissionV1;
  stats?: SnapshotSidebar;
  result?: MissionObjectiveResult;
}

export function MissionObjectives({ mission, stats, result }: MissionObjectivesProps) {
  const presentation = missionObjectivePresentation(mission, stats, result);
  if (!presentation) return null;
  return <section className="mission-objectives" aria-labelledby="mission-objectives-title">
    <div className="mission-objectives-heading">
      <p className="eyebrow">Mission objectives</p>
      <span className={`mission-objectives-state ${presentation.status}`}>{statusLabel(presentation.status)}</span>
    </div>
    <h2 id="mission-objectives-title">{presentation.title}</h2>
    <ul>
      {presentation.items.map((item) => <li key={item.id} className={item.status}>
        <span className="mission-objective-marker" aria-hidden="true" />
        <div>
          <strong>{item.label}</strong>
          <p>{item.description}</p>
          <small>{item.progress}</small>
        </div>
      </li>)}
    </ul>
  </section>;
}
