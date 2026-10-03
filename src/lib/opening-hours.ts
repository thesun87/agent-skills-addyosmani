// Opening-hours rules in shop time (Asia/Ho_Chi_Minh). Vietnam is UTC+7 all year with no DST,
// so a fixed offset is exact and keeps results independent of the server time zone.

const SHOP_UTC_OFFSET_MINUTES = 7 * 60;
const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60_000;
const DAYS_TO_SEARCH = 7;

export const PICKUP_SLOT_MINUTES = 15;
export const PICKUP_LEAD_MINUTES = 15;

/** "HH:mm" in shop time. Overnight ranges are not supported: close must be after open. */
export type DayHours = Readonly<{ open: string; close: string }>;

/** Keyed by weekday as in Date#getDay (0 = Sunday … 6 = Saturday); null means closed all day. */
export type OpeningHours = Readonly<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DayHours | null>>;

type Weekday = keyof OpeningHours;

type ShopClock = Readonly<{
  weekday: Weekday;
  minuteOfDay: number;
  /** Start of the shop-local day, as an absolute instant. */
  dayStart: Date;
}>;

function parseTime(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toShopClock(instant: Date): ShopClock {
  const shifted = new Date(instant.getTime() + SHOP_UTC_OFFSET_MINUTES * MS_PER_MINUTE);
  const minuteOfDay = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const dayStartMs =
    instant.getTime() -
    (minuteOfDay * MS_PER_MINUTE + shifted.getUTCSeconds() * 1000 + shifted.getUTCMilliseconds());

  return { weekday: shifted.getUTCDay() as Weekday, minuteOfDay, dayStart: new Date(dayStartMs) };
}

function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MS_PER_MINUTE);
}

function isWithin(day: DayHours | null, minuteOfDay: number): day is DayHours {
  return day !== null && minuteOfDay >= parseTime(day.open) && minuteOfDay < parseTime(day.close);
}

export function isOpenNow(hours: OpeningHours, now: Date): boolean {
  const { weekday, minuteOfDay } = toShopClock(now);
  return isWithin(hours[weekday], minuteOfDay);
}

/** The next instant strictly after `now` at which the shop opens, or null if it never opens. */
export function nextOpeningTime(hours: OpeningHours, now: Date): Date | null {
  const { weekday, minuteOfDay, dayStart } = toShopClock(now);

  for (let offset = 0; offset <= DAYS_TO_SEARCH; offset += 1) {
    const day = hours[((weekday + offset) % 7) as Weekday];
    if (!day) continue;

    const openMinute = parseTime(day.open);
    if (offset === 0 && openMinute <= minuteOfDay) continue;

    return addMinutes(dayStart, offset * MINUTES_PER_DAY + openMinute);
  }
  return null;
}

/** Pickup times for today: quarter-hour slots from now + lead time until before closing. */
export function pickupSlots(hours: OpeningHours, now: Date): Date[] {
  const { weekday, minuteOfDay, dayStart } = toShopClock(now);
  const today = hours[weekday];
  if (!isWithin(today, minuteOfDay)) return [];

  const earliestMs = now.getTime() + PICKUP_LEAD_MINUTES * MS_PER_MINUTE;
  const minutesFromDayStart = Math.ceil((earliestMs - dayStart.getTime()) / MS_PER_MINUTE);
  const firstSlot = Math.ceil(minutesFromDayStart / PICKUP_SLOT_MINUTES) * PICKUP_SLOT_MINUTES;
  const closeMinute = parseTime(today.close);

  const slots: Date[] = [];
  for (let minute = firstSlot; minute < closeMinute; minute += PICKUP_SLOT_MINUTES) {
    slots.push(addMinutes(dayStart, minute));
  }
  return slots;
}

/** Formats an instant as "HH:mm" in shop time, e.g. for "mở lại lúc 07:00". */
export function formatShopTime(instant: Date): string {
  const { minuteOfDay } = toShopClock(instant);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(minuteOfDay / 60))}:${pad(minuteOfDay % 60)}`;
}
