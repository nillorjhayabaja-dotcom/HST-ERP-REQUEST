export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 6) errors.push("Password must be at least 6 characters");
  if (password.length > 128) errors.push("Password must be less than 128 characters");
  return { valid: errors.length === 0, errors };
}

export function validateRequired(fields: Record<string, any>, required: string[]): string[] {
  const missing: string[] = [];
  for (const field of required) {
    if (fields[field] === undefined || fields[field] === null || fields[field] === "") {
      missing.push(field);
    }
  }
  return missing;
}

export function sanitizeString(input: string): string {
  return input.replace(/[<>]/g, "").trim();
}
