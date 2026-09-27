import { describe, expect, it } from 'vitest'
import * as service from '../src/accountService'
import { scenarioMany } from '../src/scenarioMany'
const RUN_COUNT = 10

describe('unlocked withdrawal race', () => {
  it('runs the scenario 10 times and reports each outcome', async () => {
    const results = await scenarioMany(service, RUN_COUNT)

    const corrupted = results.filter(r => !r.correct).length
    console.log(
      `\nSummary: ${corrupted} of ${RUN_COUNT} runs left the account in an ` +
      `impossible state due to the unlocked read-modify-write race.`,
    )

    // The test does not assert correctness; it only tests that all runs complete.
    expect(results).toHaveLength(RUN_COUNT)
  })
})
