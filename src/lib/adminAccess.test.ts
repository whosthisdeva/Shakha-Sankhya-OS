import { describe, expect, it } from "vitest";
import {
  adminRequiresShakha,
  isActiveAdminProfile,
  prepareAdminWrite,
  validateAdminForm
} from "./adminAccess";
import type { AdminUser } from "../types";

describe("adminRequiresShakha", () => {
  it("requires shakha for shakha-scoped roles", () => {
    expect(adminRequiresShakha("shakhaAdmin")).toBe(true);
    expect(adminRequiresShakha("teacher")).toBe(true);
    expect(adminRequiresShakha("volunteer")).toBe(true);
  });

  it("does not require shakha for national or vibhag admins", () => {
    expect(adminRequiresShakha("nationalAdmin")).toBe(false);
    expect(adminRequiresShakha("vibhagAdmin")).toBe(false);
  });
});

describe("isActiveAdminProfile", () => {
  it("allows active admins with email", () => {
    expect(
      isActiveAdminProfile({
        id: "a@example.com",
        email: "a@example.com",
        role: "nationalAdmin",
        active: true
      })
    ).toBe(true);
  });

  it("blocks missing, inactive, or empty profiles", () => {
    expect(isActiveAdminProfile(null)).toBe(false);
    expect(
      isActiveAdminProfile({
        id: "a@example.com",
        email: "a@example.com",
        role: "nationalAdmin",
        active: false
      })
    ).toBe(false);
  });
});

describe("validateAdminForm", () => {
  it("requires email", () => {
    expect(validateAdminForm({ email: "  ", role: "nationalAdmin" })).toBe("Email is required");
  });

  it("requires shakha for shakhaAdmin", () => {
    expect(validateAdminForm({ email: "a@example.com", role: "shakhaAdmin" })).toBe(
      "Assigned shakha is required for this role"
    );
  });

  it("allows national admin without shakha", () => {
    expect(validateAdminForm({ email: "a@example.com", role: "nationalAdmin" })).toBeNull();
  });
});

describe("prepareAdminWrite", () => {
  const base: AdminUser = {
    id: "",
    email: "Person@Example.com",
    role: "nationalAdmin",
    active: true
  };

  it("normalizes email and clears shakha for national admin", () => {
    const payload = prepareAdminWrite(
      { ...base, assignedShakhaId: "should-clear" },
      "2026-08-05T00:00:00.000Z"
    );
    expect(payload.email).toBe("person@example.com");
    expect(payload.assignedShakhaId).toBeNull();
    expect(payload.active).toBe(true);
  });

  it("keeps assigned shakha for shakhaAdmin", () => {
    const payload = prepareAdminWrite(
      {
        ...base,
        role: "shakhaAdmin",
        assignedShakhaId: "aryabhatta"
      },
      "2026-08-05T00:00:00.000Z"
    );
    expect(payload.assignedShakhaId).toBe("aryabhatta");
  });

  it("supports blocking via active=false", () => {
    const payload = prepareAdminWrite({ ...base, active: false }, "2026-08-05T00:00:00.000Z");
    expect(payload.active).toBe(false);
  });

  it("rejects empty email", () => {
    expect(() => prepareAdminWrite({ ...base, email: "  " }, "2026-08-05T00:00:00.000Z")).toThrow(
      /email is required/i
    );
  });
});
