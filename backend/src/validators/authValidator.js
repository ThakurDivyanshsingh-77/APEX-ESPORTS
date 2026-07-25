const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validateSignupInput = ({ name, email, phone, password }) => {
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !validateEmail(email)) errors.push('Valid email address is required');
  if (!phone || phone.trim().length < 8) errors.push('Valid phone number is required');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  return { isValid: errors.length === 0, errors };
};

const validateLoginInput = ({ email, password }) => {
  const errors = [];
  if (!email || !validateEmail(email)) errors.push('Valid email address is required');
  if (!password) errors.push('Password is required');
  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateSignupInput,
  validateLoginInput,
};
