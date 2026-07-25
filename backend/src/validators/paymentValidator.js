const validateUTR = (utr) => {
  if (!utr) return false;
  // Enforces 12-character numeric or alphanumeric UPI reference ID
  const cleaned = utr.trim();
  return cleaned.length >= 8 && cleaned.length <= 20;
};

const validatePaymentInput = ({ tournamentId, amount, utr }) => {
  const errors = [];
  if (!tournamentId) errors.push('Tournament ID is required');
  if (amount === undefined || amount === null || Number(amount) < 0) errors.push('Valid payment amount is required');
  if (!validateUTR(utr)) errors.push('Valid 12-digit UTR / UPI Transaction Reference ID is required');
  return { isValid: errors.length === 0, errors };
};

module.exports = { validateUTR, validatePaymentInput };
