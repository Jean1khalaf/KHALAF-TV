import { neon } from "@neondatabase/serverless";

export const PAIRING_TTL_MINUTES = 10;
export function pairingDb() {
  if (!process.env.DATABASE_URL) throw new Error("Pairing requires DATABASE_URL. Configure Neon and run db/schema.sql.");
  return neon(process.env.DATABASE_URL);
}
export function randomSecret(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data, (b) => b.toString(16).padStart(2, "0")).join("");
}
export function validCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{8}$/.test(value);
}
