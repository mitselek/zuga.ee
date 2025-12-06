import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "../app/page";

describe("Home Page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { name: /zuga\.ee/i });
    expect(heading).toBeInTheDocument();
  });

  it("displays coming soon message", () => {
    render(<Home />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
