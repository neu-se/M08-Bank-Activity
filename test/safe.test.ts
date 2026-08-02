import { describe, expect, it } from 'vitest'
import * as lockedService from '../src/accountServiceSafe.js'
import { runManyScenarios } from './support.js'

const RUN_COUNT = 10

describe('locked withdrawal (per-account mutex)', () => {
  it('runs the scenario 10 times and every run is correct', async () => {
    const results = await runManyScenarios(lockedService, RUN_COUNT)

    const corrupted = results.filter(r => !r.correct).length
    console.log(
      `\nSummary: ${corrupted}/${RUN_COUNT} runs corrupted — ` +
        `the per-account lock serializes the read-modify-write.`,
    )

    // The lock makes the outcome deterministic and correct: exactly one $75
    // withdrawal succeeds against $100, the other is rejected, $25 remains.
    results.forEach(result => {
      expect(result.correct).toBe(true)
      expect(result.finalBalance).toBe(25)
      expect(result.withdrawals.filter(w => w.succeeded)).toHaveLength(1)
    })
  })
})
