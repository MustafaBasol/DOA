import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from '../../src/modules/subscriptions/subscriptions.validation';

describe('Subscriptions Validation Schemas', () => {
  describe('createSubscriptionSchema', () => {
    const validSubscriptionData = {
      userId: 1,
      planName: 'Premium Plan',
      planPrice: 99.99,
      billingCycle: 'MONTHLY',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-02-01T00:00:00.000Z',
    };

    it('should validate valid subscription data', () => {
      const { error, value } = createSubscriptionSchema.validate(validSubscriptionData);

      expect(error).toBeUndefined();
      expect(value.autoRenew).toBe(true); // default value
    });

    it('should validate with optional fields', () => {
      const dataWithOptional = {
        ...validSubscriptionData,
        maxMessages: 1000,
        maxUsers: 5,
        features: ['Feature 1', 'Feature 2'],
        autoRenew: false,
      };

      const { error } = createSubscriptionSchema.validate(dataWithOptional);

      expect(error).toBeUndefined();
    });

    it('should reject invalid userId (string)', () => {
      const invalidData = {
        ...validSubscriptionData,
        userId: 'not-a-number' as any,
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('userId');
    });

    it('should reject negative userId', () => {
      const invalidData = {
        ...validSubscriptionData,
        userId: -1,
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject zero userId', () => {
      const invalidData = {
        ...validSubscriptionData,
        userId: 0,
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject planName shorter than 2 characters', () => {
      const invalidData = {
        ...validSubscriptionData,
        planName: 'P',
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('planName');
    });

    it('should reject planName longer than 100 characters', () => {
      const invalidData = {
        ...validSubscriptionData,
        planName: 'A'.repeat(101),
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should accept planName exactly 100 characters', () => {
      const validData = {
        ...validSubscriptionData,
        planName: 'A'.repeat(100),
      };

      const { error } = createSubscriptionSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject negative planPrice', () => {
      const invalidData = {
        ...validSubscriptionData,
        planPrice: -10,
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject zero planPrice', () => {
      const invalidData = {
        ...validSubscriptionData,
        planPrice: 0,
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should validate QUARTERLY billing cycle', () => {
      const validData = {
        ...validSubscriptionData,
        billingCycle: 'QUARTERLY',
      };

      const { error } = createSubscriptionSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should validate YEARLY billing cycle', () => {
      const validData = {
        ...validSubscriptionData,
        billingCycle: 'YEARLY',
      };

      const { error } = createSubscriptionSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject invalid billing cycle', () => {
      const invalidData = {
        ...validSubscriptionData,
        billingCycle: 'DAILY',
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('billingCycle');
    });

    it('should accept null maxMessages', () => {
      const validData = {
        ...validSubscriptionData,
        maxMessages: null,
      };

      const { error } = createSubscriptionSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should accept null maxUsers', () => {
      const validData = {
        ...validSubscriptionData,
        maxUsers: null,
      };

      const { error } = createSubscriptionSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject negative maxMessages', () => {
      const invalidData = {
        ...validSubscriptionData,
        maxMessages: -100,
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject endDate before startDate', () => {
      const invalidData = {
        ...validSubscriptionData,
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z',
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('endDate');
    });

    it('should reject endDate equal to startDate', () => {
      const sameDate = '2024-01-01T00:00:00.000Z';
      const invalidData = {
        ...validSubscriptionData,
        startDate: sameDate,
        endDate: sameDate,
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should validate features as array of strings', () => {
      const validData = {
        ...validSubscriptionData,
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
      };

      const { error } = createSubscriptionSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject features with non-string items', () => {
      const invalidData = {
        ...validSubscriptionData,
        features: ['Valid', 123, 'Another'] as any,
      };

      const { error } = createSubscriptionSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject missing required userId', () => {
      const { userId, ...dataWithoutUserId } = validSubscriptionData;

      const { error } = createSubscriptionSchema.validate(dataWithoutUserId);

      expect(error).toBeDefined();
    });

    it('should reject missing required planName', () => {
      const { planName, ...dataWithoutPlanName } = validSubscriptionData;

      const { error } = createSubscriptionSchema.validate(dataWithoutPlanName);

      expect(error).toBeDefined();
    });

    it('should set default autoRenew to true', () => {
      const { value } = createSubscriptionSchema.validate(validSubscriptionData);

      expect(value.autoRenew).toBe(true);
    });

    it('should allow explicit autoRenew false', () => {
      const dataWithAutoRenew = {
        ...validSubscriptionData,
        autoRenew: false,
      };

      const { value } = createSubscriptionSchema.validate(dataWithAutoRenew);

      expect(value.autoRenew).toBe(false);
    });
  });

  describe('updateSubscriptionSchema', () => {
    it('should validate partial update with single field', () => {
      const validUpdate = {
        planName: 'Updated Plan',
      };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate update with multiple fields', () => {
      const validUpdate = {
        planName: 'Pro Plan',
        planPrice: 149.99,
        autoRenew: false,
      };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should reject empty update object', () => {
      const emptyUpdate = {};

      const { error } = updateSubscriptionSchema.validate(emptyUpdate);

      expect(error).toBeDefined();
      expect(error?.message).toContain('must have at least');
    });

    it('should validate status update to ACTIVE', () => {
      const validUpdate = { status: 'ACTIVE' };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate status update to CANCELLED', () => {
      const validUpdate = { status: 'CANCELLED' };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate status update to EXPIRED', () => {
      const validUpdate = { status: 'EXPIRED' };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate status update to SUSPENDED', () => {
      const validUpdate = { status: 'SUSPENDED' };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const invalidUpdate = { status: 'INVALID_STATUS' };

      const { error } = updateSubscriptionSchema.validate(invalidUpdate);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('status');
    });

    it('should validate billing cycle update', () => {
      const validUpdate = { billingCycle: 'YEARLY' };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should reject invalid billing cycle in update', () => {
      const invalidUpdate = { billingCycle: 'WEEKLY' };

      const { error } = updateSubscriptionSchema.validate(invalidUpdate);

      expect(error).toBeDefined();
    });

    it('should validate maxMessages update with null', () => {
      const validUpdate = { maxMessages: null };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate features update', () => {
      const validUpdate = { features: ['New Feature', 'Another Feature'] };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should reject negative planPrice in update', () => {
      const invalidUpdate = { planPrice: -50 };

      const { error } = updateSubscriptionSchema.validate(invalidUpdate);

      expect(error).toBeDefined();
    });

    it('should reject short planName in update', () => {
      const invalidUpdate = { planName: 'A' };

      const { error } = updateSubscriptionSchema.validate(invalidUpdate);

      expect(error).toBeDefined();
    });

    it('should validate date updates', () => {
      const validUpdate = {
        startDate: '2024-03-01T00:00:00.000Z',
        endDate: '2024-04-01T00:00:00.000Z',
      };

      const { error } = updateSubscriptionSchema.validate(validUpdate);

      expect(error).toBeUndefined();
    });

    it('should validate autoRenew boolean update', () => {
      const trueUpdate = { autoRenew: true };
      const falseUpdate = { autoRenew: false };

      expect(updateSubscriptionSchema.validate(trueUpdate).error).toBeUndefined();
      expect(updateSubscriptionSchema.validate(falseUpdate).error).toBeUndefined();
    });
  });
});
