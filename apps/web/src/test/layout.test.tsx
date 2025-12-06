import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RootLayout from "../app/layout";

describe("RootLayout", () => {
  it("renders children correctly", () => {
    render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("sets the correct language attribute", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const html = container.querySelector("html");
    expect(html).toHaveAttribute("lang", "et");
  });
});
