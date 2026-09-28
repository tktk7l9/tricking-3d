import { describe, expect, it } from "vitest";
import { axisLabel, categoryLabel, takeoffLabel } from "./labels";

describe("axisLabel", () => {
  it("explains each axis in plain words", () => {
    expect(axisLabel("x")).toBe("X 軸（左右・宙返り）");
    expect(axisLabel("y")).toBe("Y 軸（縦・ひねり）");
    expect(axisLabel("z")).toBe("Z 軸（前後・側転）");
  });
  it("says なし instead of a dash when there is no axis", () => {
    expect(axisLabel(undefined)).toBe("なし");
  });
});

describe("takeoffLabel / categoryLabel", () => {
  it("maps enum values to Japanese", () => {
    expect(takeoffLabel("both")).toBe("両足");
    expect(takeoffLabel("left")).toBe("左足");
    expect(takeoffLabel("right")).toBe("右足");
    expect(categoryLabel("kick")).toBe("キック");
    expect(categoryLabel("flip")).toBe("フリップ");
    expect(categoryLabel("twist")).toBe("ツイスト");
    expect(categoryLabel("transition")).toBe("トランジション");
  });
});
