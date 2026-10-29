// Shared by both scoped auditors; historical two-digit and future longer IDs are valid.
export function validPaperId(id) {
  return typeof id === 'string' && /^\d{2,}-[A-Za-z0-9][A-Za-z0-9-]*$/u.test(id);
}
