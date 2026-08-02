import { describe, expect, it } from 'vitest'
import { runScenario, ScenarioResult } from '../src/scenario.js'

const RUN_COUNT = 10

/**
 * Renders one run's outcome as a single readable line.
 */
const describeRun = (run: number, result: ScenarioResult): string => {
  const succeeded = result.withdrawals.filter(w => w.succeeded).length
  const verdict = result.correct ? 'OK  ' : 'BUG!'
  return (
    `Run ${String(run).padStart(2)}: ${verdict} ` +
    `final balance $${result.finalBalance} ` +
    `(${succeeded}/2 withdrawals succeeded)`
  )
}

/**
 * Runs the scenario `count` times sequentially, each against a fresh account,
 * logging each outcome and returning all results.
 */
const runManyScenarios = async (count: number): Promise<readonly ScenarioResult[]> =>
  Array.from({ length: count }, (_, index) => index + 1).reduce<Promise<ScenarioResult[]>>(
    async (accumulated, run) => {
      const results = await accumulated
      const result = await runScenario(`account-${run}`)
      console.log(describeRun(run, result))
      return [...results, result]
    },
    Promise.resolve([]),
  )

describe('concurrent withdrawal race', () => {
  it('runs the scenario 10 times and reports each outcome', async () => {
    const results = await runManyScenarios(RUN_COUNT)

    const corrupted = results.filter(r => !r.correct).length
    console.log(
      `\nSummary: ${corrupted}/${RUN_COUNT} runs left the account in an ` +
        `impossible state due to the unlocked read-modify-write race.`,
    )

    // Observe-only: every run completes, but correctness is NOT asserted —
    // the point is to watch the race corrupt some runs.
    expect(results).toHaveLength(RUN_COUNT)
  })
})
