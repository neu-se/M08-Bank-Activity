export type WithdrawalResult =
  | { succeeded: true }
  | { succeeded: false; reason: string }