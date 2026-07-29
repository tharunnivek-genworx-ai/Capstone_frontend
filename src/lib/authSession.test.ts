import { describe, expect, it } from "vitest";
import { isAuthEndpointUrl } from "./authSession";

describe("isAuthEndpointUrl", () => {
  it("matches relative auth paths", () => {
    expect(isAuthEndpointUrl("/auth/login")).toBe(true);
    expect(isAuthEndpointUrl("/auth/refresh")).toBe(true);
    expect(isAuthEndpointUrl("/auth/logout")).toBe(true);
  });

  it("matches absolute auth URLs", () => {
    expect(
      isAuthEndpointUrl("https://identity.example.run.app/auth/login")
    ).toBe(true);
    expect(
      isAuthEndpointUrl("https://identity.example.run.app/auth/refresh?x=1")
    ).toBe(true);
  });

  it("does not match study-agent or other identity routes", () => {
    expect(isAuthEndpointUrl("/spaces")).toBe(false);
    expect(isAuthEndpointUrl("/auth/me")).toBe(false);
    expect(isAuthEndpointUrl(undefined)).toBe(false);
    expect(isAuthEndpointUrl("/authorize")).toBe(false);
  });
});
