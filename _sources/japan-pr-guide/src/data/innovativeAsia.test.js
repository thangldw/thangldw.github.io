import { describe, expect, test } from "vitest";
import {
  INNOVATIVE_ASIA_SOURCE,
  innovativeAsiaUniversities,
  searchInnovativeAsiaUniversities,
} from "./innovativeAsia";

describe("Innovative Asia university search", () => {
  test("ships the 64-school partner list from the official source snapshot", () => {
    expect(innovativeAsiaUniversities).toHaveLength(64);
    expect(INNOVATIVE_ASIA_SOURCE.url).toBe("https://www.moj.go.jp/isa/content/930001659.pdf");
  });

  test("includes the four Singapore and Brunei partners used for residence incentives", () => {
    expect(searchInnovativeAsiaUniversities("Singapore")).toHaveLength(2);
    expect(searchInnovativeAsiaUniversities("Brunei")).toHaveLength(2);
    expect(searchInnovativeAsiaUniversities("Thammasat")[0].name).toContain("Sirindhorn");
  });

  test("finds partner universities by country and English name", () => {
    const vietnam = searchInnovativeAsiaUniversities("Vietnam");
    expect(vietnam.map((entry) => entry.name)).toContain("Vietnam-Japan University");
    expect(vietnam.map((entry) => entry.name)).toContain("Hanoi University of Science and Technology");

    expect(searchInnovativeAsiaUniversities("Chulalongkorn")[0]).toMatchObject({
      name: "Chulalongkorn University",
      country: "Thailand",
    });
  });
});
