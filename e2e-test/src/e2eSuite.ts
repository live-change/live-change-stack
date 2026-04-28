export type E2ETestDefinition = {
  file: string
  suite: string
  name: string
  run: () => Promise<void> | void
}

type RegistryState = {
  tests: E2ETestDefinition[]
  currentSuite: string | null
  currentFile: string | null
}

const registryState: RegistryState = {
  tests: [],
  currentSuite: null,
  currentFile: null
}

export function resetE2ERegistry(): void {
  registryState.tests = []
  registryState.currentSuite = null
  registryState.currentFile = null
}

export function getE2ERegistry(): E2ETestDefinition[] {
  return [...registryState.tests]
}

export function e2eSuite(name: string, define: () => void): void {
  const previousSuite = registryState.currentSuite
  registryState.currentSuite = name
  try {
    define()
  } finally {
    registryState.currentSuite = previousSuite
  }
}

export function setCurrentE2EFile(file: string | null): void {
  registryState.currentFile = file
}

type E2ETestFn = ((name: string, run: () => Promise<void> | void) => void) & {
  skip: (name: string, run: () => Promise<void> | void) => void
}

export const test: E2ETestFn = ((name: string, run: () => Promise<void> | void): void => {
  if(!registryState.currentSuite) {
    throw new Error(`e2e test "${name}" must be declared inside e2eSuite()`)
  }
  if(!registryState.currentFile) {
    throw new Error(`e2e test "${name}" has no source file context`)
  }
  registryState.tests.push({
    file: registryState.currentFile,
    suite: registryState.currentSuite,
    name,
    run
  })
}) as E2ETestFn

test.skip = (_name: string, _run: () => Promise<void> | void): void => {
  // No-op skip marker for compatibility with node:test API.
}
