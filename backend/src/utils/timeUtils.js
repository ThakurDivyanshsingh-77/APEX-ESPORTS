/**
 * Parses date and time strings into a JavaScript Date object considering IST timezone offset.
 * Example inputs: date = "2026-08-01", time = "18:00 IST" or "18:00"
 */
const parseTournamentMatchTime = (dateStr, timeStr) => {
  if (!dateStr) return new Date();

  try {
    const cleanTime = (timeStr || '18:00').replace(/IST/i, '').trim();
    const isoString = `${dateStr}T${cleanTime}:00+05:30`;
    const parsedDate = new Date(isoString);

    if (isNaN(parsedDate.getTime())) {
      // Fallback standard parse
      return new Date(`${dateStr} ${cleanTime}`);
    }
    return parsedDate;
  } catch (e) {
    return new Date();
  }
};

/**
 * Calculates remaining milliseconds until match start time and checks if 15-min threshold is reached.
 */
const calculateRoomUnlockState = (dateStr, timeStr) => {
  const matchDate = parseTournamentMatchTime(dateStr, timeStr);
  const now = new Date();
  const diffMs = matchDate.getTime() - now.getTime();

  // 15 minutes = 15 * 60 * 1000 = 900,000 ms
  const UNLOCK_THRESHOLD_MS = 15 * 60 * 1000;
  const isUnlocked = diffMs <= UNLOCK_THRESHOLD_MS;
  const unlockTimeRemainingMs = Math.max(0, diffMs - UNLOCK_THRESHOLD_MS);

  return {
    matchDate,
    diffMs,
    isUnlocked,
    unlockTimeRemainingMs,
  };
};

module.exports = { parseTournamentMatchTime, calculateRoomUnlockState };
