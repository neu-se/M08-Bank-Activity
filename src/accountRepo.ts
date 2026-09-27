import { get, put } from './database'
/**
 * Repository layer. Translates between the raw {balance} records of the
 * database and the plain balance numbers the service layer works with.
 */

/**
 * Returns the balance for an account, or throws if the account is unknown.
 */
export const getBalance = async (accountId: string): Promise<number> => {
  const record = await get(accountId)
  if (record === undefined) {
    throw new Error(`No account with id ${accountId}`)
  }
  return record.balance
}

/**
 * Persists a new balance for an account.
 */
export const setBalance = async (accountId: string, balance: number): Promise<void> => {
  await put(accountId, { balance })
}
