import { getBalance as repoGetBalance, setBalance } from './accountRepo'
import { type WithdrawalResult } from './types'

/**
 * A simple account service that allows deposits and withdrawals.
 */

/**
 * Returns the current balance of an account.
 */
export const getBalance = async (accountId: string): Promise<number> =>
  repoGetBalance(accountId)

/**
 * Adds funds to an account.
 */
export const depositFunds = async (accountId: string, amount: number): Promise<void> => {
  const balance = await repoGetBalance(accountId)
  await setBalance(accountId, balance + amount)
}

/**
 * Attempts to withdraw funds from an account. Succeeds only if the account
 * holds at least `amount`.
 *
 * NOTE: this is deliberately unsafe. Reading the balance is asynchronous, so a
 * withdrawal yields the event loop at `await repoGetBalance` before it decides
 * whether to write. With no lock protecting the read-modify-write sequence, two
 * concurrent withdrawals both read the same balance, both pass the sufficiency
 * check, and both write — overdrawing the account.
 */
export const withdrawFunds = async (
  accountId: string,
  amount: number,
): Promise<WithdrawalResult> => {
  const balance = await repoGetBalance(accountId)
  if (balance < amount) {
    return { succeeded: false, reason: 'Insufficient funds' }
  }
  await setBalance(accountId, balance - amount)
  return { succeeded: true }
}
