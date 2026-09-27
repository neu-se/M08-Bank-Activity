import { BankService, runScenario, ScenarioResult } from './scenario'

/**
 * Renders one run's outcome as a single readable line.
 */
const describeRun = (run: number, result: ScenarioResult): string => {
  const succeeded = result.withdrawals.filter(w => w.succeeded).length
  const verdict = result.correct ? 'OK  ' : 'BUG!'
  return (
    `Run ${String(run).padStart(2)}: ${verdict} ` +
    `final balance $${result.finalBalance} ` +
    `(${succeeded} of 2 withdrawals succeeded)`
  )
}

/**
 * Runs the scenario `count` times against the given service, each on a fresh
 * account, logging every outcome and returning all results.
 */
export const scenarioMany = async (
  service: BankService,
  count: number,
): Promise<readonly ScenarioResult[]> =>
  Array.from({ length: count }, (_, index) => index + 1).reduce<Promise<ScenarioResult[]>>(
    async (accumulated, run) => {
      const results = await accumulated
      const result = await runScenario(service, `account-${run}`)
      console.log(describeRun(run, result))
      return [...results, result]
    },
    Promise.resolve([]),
  )
