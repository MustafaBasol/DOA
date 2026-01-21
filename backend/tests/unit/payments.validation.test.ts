import {
  createPaymentSchema,
  updatePaymentSchema,
} from '../../src/modules/payments/payments.validation';

describe('Payments Validation Schemas', () => {
  describe('createPaymentSchema', () => {
    const validPaymentData = {
      userId: 1,
      amount: 99.99,
      paymentMethod: 'CREDIT_CARD',
    };

    it('should validate valid payment data', () => {
      const { error, value } = createPaymentSchema.validate(validPaymentData);

      expect(error).toBeUndefined();
      expect(value.currency).toBe('TRY'); // default value
    });

    it('should validate with optional fields', () => {
      const dataWithOptional = {
        ...validPaymentData,
        subscriptionId: 5,
        currency: 'USD',
        transactionId: 'TXN123456',
        description: 'Monthly subscription payment',
        metadata: { source: 'mobile-app', version: '1.0' },
      };

      const { error } = createPaymentSchema.validate(dataWithOptional);

      expect(error).toBeUndefined();
    });

    it('should reject invalid userId (string)', () => {
      const invalidData = {
        ...validPaymentData,
        userId: 'not-a-number' as any,
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('userId');
    });

    it('should reject negative userId', () => {
      const invalidData = {
        ...validPaymentData,
        userId: -1,
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject zero userId', () => {
      const invalidData = {
        ...validPaymentData,
        userId: 0,
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject negative amount', () => {
      const invalidData = {
        ...validPaymentData,
        amount: -10,
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject zero amount', () => {
      const invalidData = {
        ...validPaymentData,
        amount: 0,
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should accept decimal amount', () => {
      const validData = {
        ...validPaymentData,
        amount: 49.99,
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should set default currency to TRY', () => {
      const { value } = createPaymentSchema.validate(validPaymentData);

      expect(value.currency).toBe('TRY');
    });

    it('should accept USD currency', () => {
      const validData = {
        ...validPaymentData,
        currency: 'USD',
      };

      const { error, value } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value.currency).toBe('USD');
    });

    it('should accept EUR currency', () => {
      const validData = {
        ...validPaymentData,
        currency: 'EUR',
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject currency not 3 characters', () => {
      const invalidData = {
        ...validPaymentData,
        currency: 'US',
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should convert lowercase currency to uppercase', () => {
      const dataWithLowercase = {
        ...validPaymentData,
        currency: 'usd',
      };

      const { value } = createPaymentSchema.validate(dataWithLowercase);

      expect(value.currency).toBe('USD');
    });

    it('should validate CREDIT_CARD payment method', () => {
      const validData = {
        ...validPaymentData,
        paymentMethod: 'CREDIT_CARD',
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should validate BANK_TRANSFER payment method', () => {
      const validData = {
        ...validPaymentData,
        paymentMethod: 'BANK_TRANSFER',
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should validate PAYPAL payment method', () => {
      const validData = {
        ...validPaymentData,
        paymentMethod: 'PAYPAL',
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should validate OTHER payment method', () => {
      const validData = {
        ...validPaymentData,
        paymentMethod: 'OTHER',
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject invalid payment method', () => {
      const invalidData = {
        ...validPaymentData,
        paymentMethod: 'BITCOIN',
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('paymentMethod');
    });

    it('should accept optional subscriptionId', () => {
      const validData = {
        ...validPaymentData,
        subscriptionId: 123,
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject negative subscriptionId', () => {
      const invalidData = {
        ...validPaymentData,
        subscriptionId: -5,
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should accept transactionId up to 255 characters', () => {
      const validData = {
        ...validPaymentData,
        transactionId: 'T'.repeat(255),
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject transactionId longer than 255 characters', () => {
      const invalidData = {
        ...validPaymentData,
        transactionId: 'T'.repeat(256),
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should accept description up to 500 characters', () => {
      const validData = {
        ...validPaymentData,
        description: 'D'.repeat(500),
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject description longer than 500 characters', () => {
      const invalidData = {
        ...validPaymentData,
        description: 'D'.repeat(501),
      };

      const { error } = createPaymentSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should accept metadata as object', () => {
      const validData = {
        ...validPaymentData,
        metadata: {
          key1: 'value1',
          key2: 123,
          nested: { field: 'data' },
        },
      };

      const { error } = createPaymentSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject missing required userId', () => {
      const { userId, ...dataWithoutUserId } = validPaymentData;

      const { error } = createPaymentSchema.validate(dataWithoutUserId);

      expect(error).toBeDefined();
    });

    it('should reject missing required amount', () => {
      const { amount, ...dataWithoutAmount } = validPaymentData;

      const { error } = createPaymentSchema.validate(dataWithoutAmount);

      expect(error).toBeDefined();
    });

    it('should reject missing required paymentMethod', () => {
      const { paymentMethod, ...dataWithoutMethod } = validPaymentData;

      const { error } = createPaymentSchema.validate(dataWithoutMethod);

      expect(error).toBeDefined();
    });
  });

  describe('updatePaymentSchema', () => {
    it('should validate status update to COMPLETED', () => {
      const validUpdate = { status: 'COMPLETED' };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate status update to PENDING', () => {
      const validUpdate = { status: 'PENDING' };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate status update to FAILED', () => {
      const validUpdate = { status: 'FAILED' };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate status update to REFUNDED', () => {
      const validUpdate = { status: 'REFUNDED' };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const invalidUpdate = { status: 'INVALID_STATUS' };

      const { error } = updatePaymentSchema.validate(invalidUpdate);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('status');
    });

    it('should reject empty update object', () => {
      const emptyUpdate = {};

      const { error } = updatePaymentSchema.validate(emptyUpdate);

      expect(error).toBeDefined();
      expect(error?.message).toContain('must have at least');
    });

    it('should validate transactionId update', () => {
      const validUpdate = { transactionId: 'NEW_TXN_12345' };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should reject transactionId longer than 255 in update', () => {
      const invalidUpdate = { transactionId: 'T'.repeat(256) };

      const { error } = updatePaymentSchema.validate(invalidUpdate);

      expect(error).toBeDefined();
    });

    it('should validate description update', () => {
      const validUpdate = { description: 'Updated payment description' };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should reject description longer than 500 in update', () => {
      const invalidUpdate = { description: 'D'.repeat(501) };

      const { error } = updatePaymentSchema.validate(invalidUpdate);

      expect(error).toBeDefined();
    });

    it('should validate metadata update', () => {
      const validUpdate = {
        metadata: { updated: true, reason: 'reconciliation' },
      };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate multiple fields update', () => {
      const validUpdate = {
        status: 'COMPLETED',
        transactionId: 'TXN_FINAL',
        description: 'Payment completed successfully',
        metadata: { completedAt: new Date().toISOString() },
      };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate single field update', () => {
      const validUpdate = { status: 'PENDING' };

      const { error } = updatePaymentSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });
  });
});
