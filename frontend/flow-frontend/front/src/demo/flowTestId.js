export function flowTestId(value) {
  return String(value ?? '').replace(/[^A-Za-z0-9._-]+/g, '_')
}
