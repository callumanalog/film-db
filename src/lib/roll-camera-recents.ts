/**
 * Share-roll camera MRU; storage key unchanged for existing users.
 */

import { getRollPickerMru, recordRollPickerMru } from "@/lib/roll-picker-mru";

export function getRollCameraRecents(userId: string | null, limit = 3): string[] {
  return getRollPickerMru(userId, "camera", limit);
}

export function recordRollCameraRecent(userId: string | null, displayName: string): void {
  recordRollPickerMru(userId, "camera", displayName);
}
