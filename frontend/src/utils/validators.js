/**
 * Frontend validators — mirrors backend password rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one number
 */
export const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password))          errors.push('At least one uppercase letter');
  if (!/[0-9]/.test(password))          errors.push('At least one number');
  return errors;
};

export const getPasswordStrength = (password) => {
  if (!password) return { label: '', percent: 0, color: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak',   percent: 25,  color: '#ef4444' };
  if (score <= 3) return { label: 'Fair',   percent: 50,  color: '#f59e0b' };
  if (score <= 4) return { label: 'Good',   percent: 75,  color: '#6366f1' };
  return           { label: 'Strong', percent: 100, color: '#10b981' };
};
