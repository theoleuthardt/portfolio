import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bootSteps } from "../terminal/boot";
import { BootScreen } from "./BootScreen";

describe("BootScreen", () => {
  it("shows the first step for values below one", () => {
    render(<BootScreen reached={0} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(bootSteps[0].percent),
    );
  });

  it("shows the last step for values beyond the end", () => {
    render(<BootScreen reached={99} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });
});
