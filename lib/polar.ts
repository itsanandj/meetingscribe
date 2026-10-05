import "server-only";
import { createPolar, type Environment } from "@polar-sh/sdk/2026-10";

/**
 * Which Polar to talk to, from POLAR_SERVER in .env.local: "sandbox" (fake
 * money) or "production" (real money). Anything else is a mistake, so we stop
 * rather than guess.
 */
function getEnvironment(): Environment {
  const server = process.env.POLAR_SERVER;
  if (server === "sandbox" || server === "production") return server;
  throw new Error('POLAR_SERVER must be "sandbox" or "production".');
}

export function getPolarConfig() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is not set.");
  return { accessToken, environment: getEnvironment() };
}

export function createPolarClient() {
  return createPolar(getPolarConfig());
}
