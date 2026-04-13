// src/enums/index.ts
export enum PuzzleStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  SOLVED = 'solved',
  EXPIRED = 'expired'
}

export enum RewardType {
  FOOD = 'food',
  VOUCHER = 'voucher',
  MERCHANDISE = 'merchandise',
  DIGITAL = 'digital'
}

export enum RedemptionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum AdminRole {
  SUPER_ADMIN = 'admin',
  OPERATOR = 'operator'
}