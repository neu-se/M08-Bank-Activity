import { depositFunds, getBalance, withdrawFunds, WithdrawalResult } from './accountService.js'
import { setBalance } from './accountRepo.js'

/**
 * The observed outcome of a single run of the race scenario.
 */
export type ScenarioResult = {
  finalBalance: number
  withdrawals: readonly WithdrawalResult[]
  correct: boolean
}

/**
 * The balance we expect in a correctly-synchronized system: one $75 withdrawal
 * succeeds against a $100 balance and the other fails, leaving $25.
 */
const EXPECTED_FINAL_BALANCE = 25

/**
 * Runs the race scenario once against a fresh account:
 *   1. create the account and confirm the balance starts at zero
 *   2. deposit $100 and confirm the balance
 *   3. fire two concurrent $75 withdrawals via Promise.all
 *   4. report the final balance and whether it matches a correct system
 *
 * Because withdrawFunds is unlocked, the two withdrawals may both succeed,
 * leaving an impossible balance.
 */
export const runScenario = async (accountId: string): Promise<ScenarioResult> => {
  await setBalance(accountId, 0)
  const initialBalance = await getBalance(accountId)
  if (initialBalance !== 0) {
    throw new Error(`Expected new account to start at 0, got ${initialBalance}`)
  }

  await depositFunds(accountId, 100)
  const fundedBalance = await getBalance(accountId)
  if (fundedBalance !== 100) {
    throw new Error(`Expected balance of 100 after deposit, got ${fundedBalance}`)
  }

  const withdrawals = await Promise.all([
    withdrawFunds(accountId, 75),
    withdrawFunds(accountId, 75),
  ])

  const finalBalance = await getBalance(accountId)
  const succeededCount = withdrawals.filter(w => w.succeeded).length

  // A correct system lets exactly one $75 withdrawal succeed against $100 and
  // leaves $25 behind. If both "succeed" the account was overdrawn: the bank
  // paid out $150 while its books only show a single $75 debit.
  const correct = succeededCount === 1 && finalBalance === EXPECTED_FINAL_BALANCE

  return { finalBalance, withdrawals, correct }
}
