const validateTournamentInput = (data) => {
  const errors = [];
  if (!data.title || data.title.trim().length < 3) errors.push('Title must be at least 3 characters');
  if (!data.game || data.game.trim().length < 2) errors.push('Game name is required');
  if (!data.prizePool || data.prizePool.trim().length < 1) errors.push('Prize pool details required');
  if (!data.slots || Number(data.slots) < 2) errors.push('Slots must be at least 2');
  if (!data.date) errors.push('Tournament date is required');
  if (!data.time) errors.push('Tournament start time is required');
  return { isValid: errors.length === 0, errors };
};

module.exports = { validateTournamentInput };
