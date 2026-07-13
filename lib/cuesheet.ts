import type { Session } from "./types";
import generated from "./generated/cuesheet.json";

export const sessions: Session[] = generated.sessions as Session[];

export function getSessionById(id: string): Session | undefined {
  return sessions.find((s) => s.id === id);
}

export const defaultSessionId = sessions[0]?.id ?? "";
