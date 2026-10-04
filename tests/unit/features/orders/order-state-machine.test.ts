import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStatuses,
  canCancel,
  validateTransition,
  validateCancel,
} from "@/features/orders/domain/order-state-machine";

describe("Order State Machine Pure Domain Logic (T12, A5)", () => {
  describe("Delivery fulfillment lifecycle", () => {
    it("follows valid delivery sequence: PENDING -> CONFIRMED -> PREPARING -> DELIVERING -> COMPLETED", () => {
      expect(canTransition("PENDING", "CONFIRMED", "DELIVERY")).toBe(true);
      expect(canTransition("CONFIRMED", "PREPARING", "DELIVERY")).toBe(true);
      expect(canTransition("PREPARING", "DELIVERING", "DELIVERY")).toBe(true);
      expect(canTransition("DELIVERING", "COMPLETED", "DELIVERY")).toBe(true);
    });

    it("rejects READY_FOR_PICKUP for delivery orders", () => {
      expect(canTransition("PREPARING", "READY_FOR_PICKUP", "DELIVERY")).toBe(false);
      const res = validateTransition("PREPARING", "READY_FOR_PICKUP", "DELIVERY");
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.reason).toBeDefined();
      }
    });

    it("rejects jumping steps (e.g. PENDING -> DELIVERING or PENDING -> COMPLETED)", () => {
      expect(canTransition("PENDING", "DELIVERING", "DELIVERY")).toBe(false);
      expect(canTransition("PENDING", "COMPLETED", "DELIVERY")).toBe(false);
    });
  });

  describe("Pickup fulfillment lifecycle", () => {
    it("follows valid pickup sequence: PENDING -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> COMPLETED", () => {
      expect(canTransition("PENDING", "CONFIRMED", "PICKUP")).toBe(true);
      expect(canTransition("CONFIRMED", "PREPARING", "PICKUP")).toBe(true);
      expect(canTransition("PREPARING", "READY_FOR_PICKUP", "PICKUP")).toBe(true);
      expect(canTransition("READY_FOR_PICKUP", "COMPLETED", "PICKUP")).toBe(true);
    });

    it("rejects DELIVERING for pickup orders", () => {
      expect(canTransition("PREPARING", "DELIVERING", "PICKUP")).toBe(false);
      const res = validateTransition("PREPARING", "DELIVERING", "PICKUP");
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.reason).toBeDefined();
      }
    });
  });

  describe("Cancellation rules", () => {
    it("allows cancellation from PENDING, CONFIRMED, and PREPARING", () => {
      expect(canCancel("PENDING")).toBe(true);
      expect(canCancel("CONFIRMED")).toBe(true);
      expect(canCancel("PREPARING")).toBe(true);
    });

    it("rejects cancellation from DELIVERING, READY_FOR_PICKUP, COMPLETED, or CANCELLED", () => {
      expect(canCancel("DELIVERING")).toBe(false);
      expect(canCancel("READY_FOR_PICKUP")).toBe(false);
      expect(canCancel("COMPLETED")).toBe(false);
      expect(canCancel("CANCELLED")).toBe(false);
    });

    it("validates that cancel reason must not be empty", () => {
      expect(validateCancel("PENDING", "Hết nguyên liệu").valid).toBe(true);
      expect(validateCancel("PENDING", "").valid).toBe(false);
      expect(validateCancel("PENDING", "   ").valid).toBe(false);
      expect(validateCancel("DELIVERING", "Khách gọi huỷ").valid).toBe(false);
    });
  });

  describe("getNextStatuses helper", () => {
    it("returns next valid status for delivery and pickup", () => {
      expect(getNextStatuses("PREPARING", "DELIVERY")).toEqual(["DELIVERING"]);
      expect(getNextStatuses("PREPARING", "PICKUP")).toEqual(["READY_FOR_PICKUP"]);
      expect(getNextStatuses("COMPLETED", "DELIVERY")).toEqual([]);
      expect(getNextStatuses("CANCELLED", "PICKUP")).toEqual([]);
    });
  });
});
