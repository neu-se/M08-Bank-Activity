import Keyv from 'keyv'

/**
 * A single record stored in the database. Every account is just a balance.
 */
export type AccountRecord = { balance: number }

/**
 * The backing store. Keyv defaults to an in-memory Map when no adapter is
 * supplied, which is all this pedagogical example needs.
 */
const store = new Keyv<AccountRecord>()

/**
 * Writes a record for the given key, overwriting any existing value.
 */
export const put = async (key: string, value: AccountRecord): Promise<void> => {
  await store.set(key, value)
}

/**
 * Reads the record for the given key, or undefined if no such record exists.
 */
export const get = async (key: string): Promise<AccountRecord | undefined> =>
  store.get(key)
