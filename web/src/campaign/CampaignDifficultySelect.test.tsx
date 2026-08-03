import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Difficulty } from "../simulation/protocol";
import { CampaignDifficultySelect } from "./CampaignDifficultySelect";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("CampaignDifficultySelect", () => {
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
  });

  it("presents Easy, Normal, and Hard with Normal selected by default", () => {
    act(() => root.render(<CampaignDifficultySelect value={Difficulty.Normal} onChange={() => undefined} />));

    const select = container.querySelector("select");
    expect(select?.value).toBe(String(Difficulty.Normal));
    expect([...container.querySelectorAll("option")].map((option) => option.textContent)).toEqual(["Easy", "Normal", "Hard"]);
    expect(container.querySelector("label")?.textContent).toContain("Difficulty");
    expect(container.querySelector("#campaign-difficulty-help")?.textContent)
      .toBe("Classic campaign balance. Applies to new missions. Restarts and campaign continuation retain the current run difficulty.");
    expect(select?.getAttribute("aria-describedby")).toBe("campaign-difficulty-help");
  });

  it("updates the helper copy when the player chooses another difficulty", () => {
    function Harness() {
      const [difficulty, setDifficulty] = useState(Difficulty.Normal);
      return <CampaignDifficultySelect value={difficulty} onChange={setDifficulty} />;
    }
    act(() => root.render(<Harness />));

    const select = container.querySelector("select");
    if (!(select instanceof HTMLSelectElement)) throw new Error("Difficulty select was not rendered");
    act(() => {
      select.value = String(Difficulty.Hard);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(select.value).toBe(String(Difficulty.Hard));
    expect(container.querySelector("#campaign-difficulty-help")?.textContent)
      .toBe("A tougher campaign for experienced commanders. Applies to new missions. Restarts and campaign continuation retain the current run difficulty.");
  });
});
