import { WithdrawalResult } from './accountService.js'
import { setBalance } from './accountRepo.js'

/**
 * The account operations the scenario exercises. Both the unlocked service and
 * the locked service satisfy this shape, so the same scenario can drive either
 * one and we can compare their behavior directly.
 */
export type BankService = {
  getBalance: (accountId: string) => Promise<number>
  depositFunds: (accountId: string, amount: number) => Promise<void>
  withdrawFunds: (accountId: string, amount: number) => Promise<WithdrawalResult>
}

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
 * Runs the scenario once against a fresh account using the given service:
 *   1. create the account and confirm the balance starts at zero
 *   2. deposit $100 and confirm the balance
 *   3. fire two concurrent $75 withdrawals via Promise.all
 *   4. report the final balance and whether it matches a correct system
 *
 * With the unlocked service the two withdrawals may both succeed, leaving an
 * impossible balance; with the locked service exactly one succeeds.
 */
export const runScenario = async (
  service: BankService,
  accountId: string,
): Promise<ScenarioResult> => {
  await setBalance(accountId, 0)
  const initialBalance = await service.getBalance(accountId)
  if (initialBalance !== 0) {
    throw new Error(`Expected new account to start at 0, got ${initialBalance}`)
  }

  await service.depositFunds(accountId, 100)
  const fundedBalance = await service.getBalance(accountId)
  if (fundedBalance !== 100) {
    throw new Error(`Expected balance of 100 after deposit, got ${fundedBalance}`)
  }

  const withdrawals = await Promise.all([
    service.withdrawFunds(accountId, 75),
    service.withdrawFunds(accountId, 75),
  ])

  const finalBalance = await service.getBalance(accountId)
  const succeededCount = withdrawals.filter(w => w.succeeded).length

  // A correct system lets exactly one $75 withdrawal succeed against $100 and
  // leaves $25 behind. If both "succeed" the account was overdrawn: the bank
  // paid out $150 while its books only show a single $75 debit.
  const correct = succeededCount === 1 && finalBalance === EXPECTED_FINAL_BALANCE

  return { finalBalance, withdrawals, correct }
}
