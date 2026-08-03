import { Difficulty } from "../simulation/protocol";

export interface CampaignDifficultyOption {
  value: Difficulty;
  label: string;
  description: string;
}

export const CAMPAIGN_DIFFICULTY_OPTIONS: readonly CampaignDifficultyOption[] = [
  { value: Difficulty.Easy, label: "Easy", description: "More forgiving combat and economy." },
  { value: Difficulty.Normal, label: "Normal", description: "Classic campaign balance." },
  { value: Difficulty.Hard, label: "Hard", description: "A tougher campaign for experienced commanders." },
];

export function isCampaignDifficulty(value: number): value is Difficulty {
  return value === Difficulty.Easy || value === Difficulty.Normal || value === Difficulty.Hard;
}

export interface CampaignDifficultySelectProps {
  value: Difficulty;
  disabled?: boolean;
  onChange: (value: Difficulty) => void;
}

export function CampaignDifficultySelect({ value, disabled = false, onChange }: CampaignDifficultySelectProps) {
  const selected = CAMPAIGN_DIFFICULTY_OPTIONS.find((option) => option.value === value)
    ?? CAMPAIGN_DIFFICULTY_OPTIONS[1];
  return <>
    <label>Difficulty<select
      value={value}
      disabled={disabled}
      aria-describedby="campaign-difficulty-help"
      onChange={(event) => {
        const difficulty = Number(event.currentTarget.value);
        if (isCampaignDifficulty(difficulty)) onChange(difficulty);
      }}
    >
      {CAMPAIGN_DIFFICULTY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>
    <p id="campaign-difficulty-help" className="mission-picker-help">
      {selected.description} Applies to new missions. Restarts and campaign continuation retain the current run difficulty.
    </p>
  </>;
}
