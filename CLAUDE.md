I want a pedagogical example to illustrate how naive concurrency with typescript can lead to dangerous data races.

I want a simple keyv database.  Each record in the database should be of the form {balance: number}.
The database should just export put and get methods.

We should have a repo layer that exports methods called getBalance and setBalance.

We should have a service layer with methods getBalance, depositFunds and withdrawFunds.

To demonstrate the problem, create a scenario that does the following
- create a new account.  Check that the balance is initially zero
- deposit $100 and check to see that the balance is correct.
- create a Promise.all with two tasks, each withdrawing $75.
- in a correct system, one withdrawal should succeed and the other should fail, leaving a balance of $25 in the account.

However, because we don't have a lock, sometimes both withdrawals will succeed.

Create a test file that runs the scenario 10 times, reporting the results of each run of the scenario.

Next: add an alernate version of accountService with a simple lock, so that the overdraft never occurs.

