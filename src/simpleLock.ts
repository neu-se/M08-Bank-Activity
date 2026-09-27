export class Lock {
  private locked = false;
  private waiting: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}


// Usage:

// const lock = new Lock();

// // Option 1: Manual acquire/release
// await lock.acquire();
// try {
//   // critical section
// } finally {
//   lock.release();
// }

// // Option 2: Using withLock (preferred - guarantees release)
// await lock.withLock(async () => {
//   // critical section
// });

