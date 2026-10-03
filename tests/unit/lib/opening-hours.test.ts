import { afterEach, describe, expect, it } from "vitest";
import {
  formatShopTime,
  isOpenNow,
  nextOpeningTime,
  pickupSlots,
  type OpeningHours,
} from "@/lib/opening-hours";

// 2026-10-04 is a Sunday, 2026-10-05 a Monday. All instants are written in Vietnam time (+07:00).
const vn = (local: string) => new Date(`${local}+07:00`);

const DAILY_7_TO_22 = { open: "07:00", close: "22:00" } as const;
const everyDay: OpeningHours = {
  0: DAILY_7_TO_22,
  1: DAILY_7_TO_22,
  2: DAILY_7_TO_22,
  3: DAILY_7_TO_22,
  4: DAILY_7_TO_22,
  5: DAILY_7_TO_22,
  6: DAILY_7_TO_22,
};
const closedOnMonday: OpeningHours = { ...everyDay, 1: null };
const alwaysClosed: OpeningHours = {
  0: null,
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

const originalTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTz;
});

describe("isOpenNow", () => {
  it.each([
    ["2026-10-05T06:59:00", false],
    ["2026-10-05T07:00:00", true],
    ["2026-10-05T21:59:00", true],
    ["2026-10-05T22:00:00", false],
    ["2026-10-05T23:30:00", false],
  ])("at %s Vietnam time → %s", (local, expected) => {
    expect(isOpenNow(everyDay, vn(local))).toBe(expected);
  });

  it("uses the Vietnam weekday, not the UTC weekday", () => {
    // Monday 06:00 in Vietnam is still Sunday 23:00 in UTC.
    const closedSundayOpensEarlyMonday: OpeningHours = {
      ...everyDay,
      0: null,
      1: { open: "05:00", close: "22:00" },
    };

    expect(isOpenNow(closedSundayOpensEarlyMonday, vn("2026-10-05T06:00:00"))).toBe(true);
  });

  it("gives the same answer whatever the server time zone is", () => {
    for (const tz of ["UTC", "America/New_York", "Asia/Tokyo"]) {
      process.env.TZ = tz;
      expect(isOpenNow(everyDay, vn("2026-10-05T07:00:00"))).toBe(true);
      expect(isOpenNow(everyDay, vn("2026-10-05T06:59:00"))).toBe(false);
    }
  });
});

describe("nextOpeningTime", () => {
  it("returns today's opening time before the shop opens", () => {
    expect(nextOpeningTime(everyDay, vn("2026-10-05T05:00:00"))).toEqual(vn("2026-10-05T07:00:00"));
  });

  it("returns tomorrow's opening time after closing", () => {
    expect(nextOpeningTime(everyDay, vn("2026-10-05T22:00:00"))).toEqual(vn("2026-10-06T07:00:00"));
  });

  it("skips days the shop is closed", () => {
    expect(nextOpeningTime(closedOnMonday, vn("2026-10-04T23:00:00"))).toEqual(
      vn("2026-10-06T07:00:00"),
    );
  });

  it("returns null when the shop never opens", () => {
    expect(nextOpeningTime(alwaysClosed, vn("2026-10-05T10:00:00"))).toBeNull();
  });
});

describe("pickupSlots", () => {
  it("starts at the first quarter hour at least 15 minutes from now", () => {
    const slots = pickupSlots(everyDay, vn("2026-10-05T10:07:00"));

    expect(slots[0]).toEqual(vn("2026-10-05T10:30:00"));
    expect(slots[1]).toEqual(vn("2026-10-05T10:45:00"));
  });

  it("allows a slot exactly 15 minutes ahead when now is on a quarter hour", () => {
    expect(pickupSlots(everyDay, vn("2026-10-05T10:00:00"))[0]).toEqual(vn("2026-10-05T10:15:00"));
  });

  it("ends with the last slot before closing time", () => {
    const slots = pickupSlots(everyDay, vn("2026-10-05T21:00:00"));

    expect(slots).toEqual([
      vn("2026-10-05T21:15:00"),
      vn("2026-10-05T21:30:00"),
      vn("2026-10-05T21:45:00"),
    ]);
  });

  it("returns no slots when the shop is closed", () => {
    expect(pickupSlots(everyDay, vn("2026-10-05T21:50:00"))).toEqual([]);
    expect(pickupSlots(everyDay, vn("2026-10-05T06:00:00"))).toEqual([]);
    expect(pickupSlots(closedOnMonday, vn("2026-10-05T10:00:00"))).toEqual([]);
  });
});

describe("formatShopTime", () => {
  it("formats an instant as HH:mm in Vietnam time", () => {
    process.env.TZ = "UTC";
    expect(formatShopTime(vn("2026-10-06T07:00:00"))).toBe("07:00");
  });
});
