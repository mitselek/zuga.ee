import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "../app/page";

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
});
