/**
 * Smoke test — verifies the Jest harness is wired correctly.
 * This is intentionally trivial: phase 1 only proves the tooling runs.
 * Real behavior tests arrive in phase 2 and beyond.
 */
describe('smoke', () => {
  it('basic arithmetic works', () => {
    expect(1 + 1).toBe(2);
  });
});
