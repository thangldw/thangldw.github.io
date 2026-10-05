import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./domain/historical", async (importOriginal) => ({ ...await importOriginal(), ASSESSMENT_DATE: "2026-10-05" }));

describe("Japan PR Guide route-specific assessment", () => {
  beforeEach(() => localStorage.clear());

  it("keeps the header focused on official sources without secondary actions", () => {
    render(<App />);

    expect(screen.queryByRole("button", { name: /EN\s*\/\s*VI/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Official sources/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Save plan|Saved plan/i })).not.toBeInTheDocument();
  });

  it("shows an uncapped HSP point total instead of implying a 100-point maximum", () => {
    render(<App />);

    expect(screen.queryByText(/\/\s*100 points/i)).not.toBeInTheDocument();
    expect(screen.getByText("75", { selector: "[data-live-score]" }).parentElement).toHaveTextContent("75 points");
  });

  it("starts with the complete 75-point technical calculator and keeps every scoring item visible", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Calculate your HSP score" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Specialized \/ technical/, pressed: true })).toBeInTheDocument();
    expect(screen.getByText("75", { selector: "[data-live-score]" })).toBeInTheDocument();
    expect(screen.getByLabelText("Highest qualifying degree")).toBeVisible();
    expect(screen.getByLabelText("Japanese language ability")).toBeVisible();
    expect(screen.getByLabelText("Employer receives qualifying innovation support")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Show more factors/i })).not.toBeInTheDocument();
  });

  it("searches the official Innovative Asia partner list instead of asking for Yes or No", async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = screen.getByRole("combobox", { name: "Search Innovative Asia partner university" });
    await user.clear(search);
    await user.type(search, "Hanoi");

    expect(screen.getByRole("option", { name: /Hanoi University of Science and Technology/ })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /Hanoi University of Science and Technology/ }));
    expect(screen.getByText("Hanoi University of Science and Technology", { selector: "[data-selected-university]" })).toBeInTheDocument();
    expect(screen.getByText("75", { selector: "[data-live-score]" })).toBeInTheDocument();
  });

  it("explains the multiple-degree dependency without exposing the engine warning key", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Highest qualifying degree"), "bachelor");
    await user.selectOptions(screen.getByLabelText("Advanced degrees in multiple fields"), "true");

    expect(screen.queryByText("multipleDegreeDependency")).not.toBeInTheDocument();
    expect(screen.getByText(/Multiple-degree points require at least one qualifying master's, doctorate, MBA, or MOT degree/i)).toBeVisible();
  });

  it("applies the MOJ JICA overlap only when training used Japanese university classes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Graduated from a Japanese university"), "true");
    await user.selectOptions(screen.getByLabelText("Qualifying JICA Innovative Asia training"), "noUniversityClasses");

    expect(screen.getByText("90", { selector: "[data-live-score]" })).toBeVisible();
    expect(screen.queryByText(/cannot be combined with Japanese-university graduation points/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Qualifying JICA Innovative Asia training"), "usedUniversityClasses");

    expect(screen.getByText("85", { selector: "[data-live-score]" })).toBeVisible();
    expect(screen.queryByText("jicaOverlap")).not.toBeInTheDocument();
    expect(screen.getByText(/JICA training that used Japanese university or graduate-school classes cannot be combined with Japanese-university graduation points/i)).toBeVisible();
  });

  it("recalculates the 70-79 route at the three-year reference date", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Review score claims" }));
    await user.click(screen.getByRole("button", { name: "Continue to historical score" }));

    expect(screen.getByRole("heading", { name: "Route-Specific Historical Recalculation" })).toBeInTheDocument();
    expect(screen.getByText("5 Oct 2023", { selector: "[data-historical-date]" })).toBeInTheDocument();
    expect(screen.getByText("75", { selector: "[data-current-total]" })).toBeInTheDocument();
    expect(screen.getByText("70", { selector: "[data-historical-total]" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Relevant professional experience.*7\+ years.*15.*4 years.*5/ })).toBeInTheDocument();
  });

  it("switches to the one-year checkpoint when the current score reaches 80+", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Expected annual remuneration"), "10");
    await user.click(screen.getByRole("button", { name: "Review score claims" }));
    await user.click(screen.getByRole("button", { name: "Continue to historical score" }));

    expect(screen.getByText("5 Oct 2025", { selector: "[data-historical-date]" })).toBeInTheDocument();
    expect(screen.getByText(/1-year PR route \(80\+ points\)/)).toBeInTheDocument();
    expect(screen.getByText("80+ points", { selector: "[data-required-threshold]" })).toBeInTheDocument();
  });

  it("continues from historical verification through PR requirements and the application plan", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Review score claims" }));
    await user.click(screen.getByRole("button", { name: "Continue to historical score" }));
    await user.click(screen.getByRole("button", { name: "Confirm historical evidence" }));
    expect(screen.getByRole("heading", { name: "PR requirements" })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /good conduct/i }));
    expect(screen.getByText("1 of 6 confirmed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue to application plan" }));
    expect(screen.getByRole("heading", { name: "Application plan" })).toBeInTheDocument();
  });

  it("switches filing rules and historical dates together without changing HSP mathematics", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText("¥200,000")).toBeVisible();
    const date = screen.getByLabelText("Planned filing date");
    await user.clear(date);
    // Native date fields have browser-specific keyboard handling; fire the controlled change.
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(date, { target: { value: "2027-04-01" } });
    expect(screen.getByText("2027 rules")).toBeVisible();
    expect(screen.getByText("75", { selector: "[data-live-score]" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Review score claims" }));
    await user.click(screen.getByRole("button", { name: "Continue to historical score" }));
    expect(screen.getByText("1 Apr 2024", { selector: "[data-historical-date]" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Confirm historical evidence" }));
    expect(screen.getByText(/A 3-year permit is no longer automatically sufficient/)).toBeVisible();
  });

  it("exposes primary sources from all three agencies", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("Official updates: ISA · Police · MOFA"));
    expect(screen.getByRole("heading", { name: /New PR guideline/ })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Police / Cảnh sát" }));
    expect(screen.getByRole("heading", { name: /Bicycle blue tickets/ })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "MOFA", exact: true }));
    expect(screen.getByRole("heading", { name: /Consular visa fees/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /MOFA · Announcement/ })).toHaveAttribute("href", "https://www.mofa.go.jp/j_info/visit/visa/procedure/pagewe_000001_00391.html");
  });
  it("awards the official technical doctorate points at both assessment dates", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText("Highest qualifying degree"), "doctor");
    expect(screen.getByText("85", { selector: "[data-live-score]" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Review score claims" }));
    await user.click(screen.getByRole("button", { name: "Continue to historical score" }));
    expect(screen.getByText("85", { selector: "[data-current-total]" })).toBeVisible();
    expect(screen.getByText("80", { selector: "[data-historical-total]" })).toBeVisible();
    expect(screen.getByText("5 Oct 2025", { selector: "[data-historical-date]" })).toBeVisible();
  });

});
