// The plan rules, in one place. Change a price or a limit here and the whole
// app follows; nothing else should hard-code these numbers.

/** Every meeting uploaded uses this many credits. */
export const CREDITS_PER_MEETING = 1;

export const FREE_PLAN = {
  name: "Free",
  /** Given once, when someone signs up. They don't come back each month. */
  credits: 3,
} as const;

export const PRO_PLAN = {
  name: "Pro",
  /** In US dollars. */
  price: 9,
  interval: "month",
  /** Given again at the start of every billing month. */
  creditsPerMonth: 30,
} as const;

/** How many meetings a number of credits pays for. */
export function meetingsFor(credits: number) {
  return Math.floor(credits / CREDITS_PER_MEETING);
}

/**
 * The Pro product's ID in Polar, from POLAR_PRO_PRODUCT_ID in .env.local.
 * Server only: the variable has no NEXT_PUBLIC_ prefix, so it's empty in the
 * browser.
 */
export function getProProductId() {
  const id = process.env.POLAR_PRO_PRODUCT_ID;
  if (!id) throw new Error("POLAR_PRO_PRODUCT_ID is not set.");
  return id;
}
