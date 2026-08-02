import { describe, expect, it } from 'vitest'
import * as unlockedService from '../src/accountService.js'
import { runManyScenarios } from './support.js'

const RUN_COUNT = 10

describe('unlocked withdrawal race', () => {
  it('runs the scenario 10 times and reports each outcome', async () => {
    const results = await runManyScenarios(unlockedService, RUN_COUNT)

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
