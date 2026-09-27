import { getBalance as repoGetBalance, setBalance } from './accountRepo'
import { type WithdrawalResult } from './types'

/**
 * A locked variant of the account service. It exposes the same interface as the
 * unlocked `accountService`, but serializes each account's read-modify-write so
 * concurrent withdrawals can no longer race.
 */




/**
 * The tail of the in-flight operation chain for each account. Holding shared
 * mutable state is unavoidable here — it *is* the lock — so it is kept small
 * and confined to `withAccountLock`.
 */
const operationTails = new Map<string, Promise<unknown>>()

/**
 * Runs `criticalSection` only after every previously-scheduled operation on the
 * same account has settled, then returns its result. This gives each account a
 * mutex: critical sections on one account run strictly one at a time, while
 * different accounts remain independent.
 */
const withAccountLock = <T>(
  accountId: string,
  criticalSection: () => Promise<T>,
): Promise<T> => {
  const predecessor = operationTails.get(accountId) ?? Promise.resolve()
  const result = predecessor.then(criticalSection)
  // Chain the next waiter after this one regardless of whether it resolved or
  // rejected, so a failed critical section still releases the lock.
  operationTails.set(accountId, result.then(() => undefined, () => undefined))
  return result
}

/**
 * Returns the current balance of an account. A lone read needs no lock.
 */
export const getBalance = async (accountId: string): Promise<number> =>
  repoGetBalance(accountId)

/**
 * Adds funds to an account, serialized against other operations on it.
 */
export const depositFunds = (accountId: string, amount: number): Promise<void> =>
  withAccountLock(accountId, async () => {
    const balance = await repoGetBalance(accountId)
    await setBalance(accountId, balance + amount)
  })

/**
 * Attempts to withdraw funds, serialized against other operations on the
 * account. Because the lock guarantees the read, the sufficiency check, and the
 * write happen atomically with respect to other withdrawals, two concurrent
 * $75 withdrawals against $100 can no longer both succeed: the first commits
 * $25, the second then reads $25 and is rejected.
 */
export const withdrawFunds = (accountId: string, amount: number): Promise<WithdrawalResult> =>
  withAccountLock(accountId, async () => {
    const balance = await repoGetBalance(accountId)
    if (balance < amount) {
      return { succeeded: false, reason: 'Insufficient funds' }
    }
    await setBalance(accountId, balance - amount)
    return { succeeded: true }
  })
