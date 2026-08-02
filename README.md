# Bank Concurrency Demo — a data race from naive async code

A pedagogical example showing how an unlocked read-modify-write over an async
store corrupts data under concurrency in TypeScript.

## Layers

| File | Responsibility |
| --- | --- |
| `src/database.ts` | A Keyv key/value store of `{ balance: number }` records. Exports `put` / `get`. |
| `src/accountRepo.ts` | Repository layer. Exports `getBalance` / `setBalance`. |
| `src/accountService.ts` | Service layer. Exports `getBalance` / `depositFunds` / `withdrawFunds` — deliberately **without a lock**. |
| `src/scenario.ts` | One run: create account → deposit $100 → two concurrent $75 withdrawals via `Promise.all`. |
| `test/race.test.ts` | Runs the scenario 10 times and reports each outcome. |

## Run it

```
npm install
npm test
```

## What you should see

```
Run  1: BUG! final balance $25 (2/2 withdrawals succeeded)
...
Summary: 10/10 runs left the account in an impossible state ...
```

Two `$75` withdrawals against a `$100` balance **both report success**, yet the
final balance is `$25`. The bank paid out `$150` but its books show only a
single `$75` debit — `$75` vanished.

## Why it happens

`withdrawFunds` reads the balance, checks it, then writes — with an `await`
in between:

```ts
const balance = await repoGetBalance(accountId)  // both tasks read $100 here
if (balance < amount) return { succeeded: false, reason: 'Insufficient funds' }
await setBalance(accountId, balance - amount)     // both tasks write $25
```

Because the read is asynchronous, both withdrawals yield the event loop at
`await repoGetBalance` and read the *same* `$100` before either one writes. Both
pass the check, both write `$25`. This is a classic **read-modify-write race**:
the check and the update are not atomic, and nothing serializes the two tasks.

## A note on "sometimes"

In a real bank running on multiple threads, processes, or machines, this race is
*intermittent* — it corrupts only when two requests happen to overlap. In this
single-threaded, in-memory model the overlap is guaranteed: `Promise.all` starts
both withdrawals in the same tick and the async read hands control back before
any write lands, so **every** run corrupts. The determinism here is a feature
for teaching — the bug reproduces every time — but the underlying hazard is the
same one that shows up unpredictably in production systems.

The fix (left as an exercise) is to make the read-modify-write atomic: a
per-account lock/mutex, a compare-and-set on the store, or a transaction.
