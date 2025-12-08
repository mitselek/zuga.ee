import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "../app/page";
import * as contentModule from "../lib/content";

describe("Home Page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { name: /zuga/i, level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it("displays performances section", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /etendused/i })).toBeInTheDocument();
  });

  it("renders performance cards with links", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    // Verify links point to Estonian content
    links.forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^\/et\//);
    });
  });

  it("renders error message when landing page not found", () => {
    // Mock loadLandingPage to return null
    const spy = vi.spyOn(contentModule, "loadLandingPage").mockReturnValue(null);

    render(<Home />);

    expect(screen.getByText("Content not found")).toBeInTheDocument();

    spy.mockRestore();
  });
});
