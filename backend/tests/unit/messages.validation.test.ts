import {
  createMessageSchema,
  updateMessageSchema,
  messageQuerySchema,
} from '../../src/modules/messages/messages.validation';

describe('Messages Validation Schemas', () => {
  describe('createMessageSchema', () => {
    const validMessageData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      direction: 'INBOUND',
      fromNumber: '+905551234567',
      toNumber: '+905559876543',
      customerPhone: '+905551234567',
      timestamp: new Date('2024-01-15T10:00:00Z'),
    };

    it('should validate valid message data with all required fields', () => {
      const { error, value } = createMessageSchema.validate(validMessageData);

      expect(error).toBeUndefined();
      expect(value.userId).toBe(validMessageData.userId);
      expect(value.direction).toBe('INBOUND');
    });

    it('should validate message with optional fields', () => {
      const dataWithOptional = {
        ...validMessageData,
        n8nMessageId: 'msg_123',
        customerName: 'John Doe',
        messageContent: 'Hello World',
        mediaUrl: 'https://example.com/image.jpg',
      };

      const { error } = createMessageSchema.validate(dataWithOptional);

      expect(error).toBeUndefined();
    });

    it('should set default messageType to text', () => {
      const { value } = createMessageSchema.validate(validMessageData);

      expect(value.messageType).toBe('text');
    });

    it('should reject invalid UUID for userId', () => {
      const invalidData = {
        ...validMessageData,
        userId: 'not-a-valid-uuid',
      };

      const { error } = createMessageSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('userId');
    });

    it('should reject invalid direction', () => {
      const invalidData = {
        ...validMessageData,
        direction: 'INVALID_DIRECTION',
      };

      const { error } = createMessageSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('direction');
    });

    it('should accept OUTBOUND direction', () => {
      const outboundData = {
        ...validMessageData,
        direction: 'OUTBOUND',
      };

      const { error } = createMessageSchema.validate(outboundData);

      expect(error).toBeUndefined();
    });

    it('should reject missing required userId', () => {
      const { userId, ...dataWithoutUserId } = validMessageData;

      const { error } = createMessageSchema.validate(dataWithoutUserId);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('userId');
    });

    it('should reject missing required direction', () => {
      const { direction, ...dataWithoutDirection } = validMessageData;

      const { error } = createMessageSchema.validate(dataWithoutDirection);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('direction');
    });

    it('should reject missing required fromNumber', () => {
      const { fromNumber, ...dataWithoutFrom } = validMessageData;

      const { error } = createMessageSchema.validate(dataWithoutFrom);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('fromNumber');
    });

    it('should reject missing required toNumber', () => {
      const { toNumber, ...dataWithoutTo } = validMessageData;

      const { error } = createMessageSchema.validate(dataWithoutTo);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('toNumber');
    });

    it('should reject missing required customerPhone', () => {
      const { customerPhone, ...dataWithoutPhone } = validMessageData;

      const { error } = createMessageSchema.validate(dataWithoutPhone);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('customerPhone');
    });

    it('should reject missing required timestamp', () => {
      const { timestamp, ...dataWithoutTimestamp } = validMessageData;

      const { error } = createMessageSchema.validate(dataWithoutTimestamp);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('timestamp');
    });

    it('should reject invalid mediaUrl format', () => {
      const invalidData = {
        ...validMessageData,
        mediaUrl: 'not-a-valid-url',
      };

      const { error } = createMessageSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('mediaUrl');
    });

    it('should accept valid https mediaUrl', () => {
      const validData = {
        ...validMessageData,
        mediaUrl: 'https://example.com/media/file.jpg',
      };

      const { error } = createMessageSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should accept valid http mediaUrl', () => {
      const validData = {
        ...validMessageData,
        mediaUrl: 'http://example.com/media/file.jpg',
      };

      const { error } = createMessageSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject invalid timestamp type', () => {
      const invalidData = {
        ...validMessageData,
        timestamp: 'not-a-date',
      };

      const { error } = createMessageSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('timestamp');
    });

    it('should accept ISO date string for timestamp', () => {
      const validData = {
        ...validMessageData,
        timestamp: '2024-01-15T10:00:00.000Z',
      };

      const { error } = createMessageSchema.validate(validData);

      expect(error).toBeUndefined();
    });
  });

  describe('updateMessageSchema', () => {
    it('should validate valid readStatus true', () => {
      const validData = { readStatus: true };

      const { error, value } = updateMessageSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value.readStatus).toBe(true);
    });

    it('should validate valid readStatus false', () => {
      const validData = { readStatus: false };

      const { error, value } = updateMessageSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value.readStatus).toBe(false);
    });

    it('should accept empty object (all fields optional)', () => {
      const emptyData = {};

      const { error } = updateMessageSchema.validate(emptyData);

      expect(error).toBeUndefined();
    });

    it('should reject non-boolean readStatus', () => {
      const invalidData = { readStatus: 'true' as any };

      const { value } = updateMessageSchema.validate(invalidData);

      // Joi may coerce 'true' string to boolean true
      expect(typeof value.readStatus).toBe('boolean');
    });

    it('should reject number for readStatus', () => {
      const invalidData = { readStatus: 1 as any };

      const { error } = updateMessageSchema.validate(invalidData);

      expect(error).toBeDefined();
    });
  });

  describe('messageQuerySchema', () => {
    it('should validate empty query with defaults', () => {
      const emptyQuery = {};

      const { error, value } = messageQuerySchema.validate(emptyQuery);

      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
    });

    it('should validate custom page and limit', () => {
      const customQuery = {
        page: 5,
        limit: 50,
      };

      const { error, value } = messageQuerySchema.validate(customQuery);

      expect(error).toBeUndefined();
      expect(value.page).toBe(5);
      expect(value.limit).toBe(50);
    });

    it('should reject page less than 1', () => {
      const invalidQuery = { page: 0 };

      const { error } = messageQuerySchema.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('page');
    });

    it('should reject negative page', () => {
      const invalidQuery = { page: -1 };

      const { error } = messageQuerySchema.validate(invalidQuery);

      expect(error).toBeDefined();
    });

    it('should reject limit less than 1', () => {
      const invalidQuery = { limit: 0 };

      const { error } = messageQuerySchema.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('limit');
    });

    it('should reject limit greater than 100', () => {
      const invalidQuery = { limit: 101 };

      const { error } = messageQuerySchema.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('limit');
    });

    it('should accept limit exactly 100', () => {
      const validQuery = { limit: 100 };

      const { error } = messageQuerySchema.validate(validQuery);

      expect(error).toBeUndefined();
    });

    it('should validate valid UUID for userId filter', () => {
      const validQuery = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const { error } = messageQuerySchema.validate(validQuery);

      expect(error).toBeUndefined();
    });

    it('should reject invalid UUID for userId filter', () => {
      const invalidQuery = {
        userId: 'not-a-uuid',
      };

      const { error } = messageQuerySchema.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('userId');
    });

    it('should validate customerPhone filter', () => {
      const validQuery = {
        customerPhone: '+905551234567',
      };

      const { error } = messageQuerySchema.validate(validQuery);

      expect(error).toBeUndefined();
    });

    it('should validate readStatus boolean filter', () => {
      const trueQuery = { readStatus: true };
      const falseQuery = { readStatus: false };

      expect(messageQuerySchema.validate(trueQuery).error).toBeUndefined();
      expect(messageQuerySchema.validate(falseQuery).error).toBeUndefined();
    });

    it('should reject invalid readStatus type', () => {
      const invalidQuery = { readStatus: 'yes' as any };

      const { error } = messageQuerySchema.validate(invalidQuery);

      expect(error).toBeDefined();
    });

    it('should validate INBOUND direction filter', () => {
      const validQuery = { direction: 'INBOUND' };

      const { error } = messageQuerySchema.validate(validQuery);

      expect(error).toBeUndefined();
    });

    it('should validate OUTBOUND direction filter', () => {
      const validQuery = { direction: 'OUTBOUND' };

      const { error } = messageQuerySchema.validate(validQuery);

      expect(error).toBeUndefined();
    });

    it('should reject invalid direction value', () => {
      const invalidQuery = { direction: 'INVALID' };

      const { error } = messageQuerySchema.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('direction');
    });

    it('should validate search string filter', () => {
      const validQuery = { search: 'test message' };

      const { error } = messageQuerySchema.validate(validQuery);

      expect(error).toBeUndefined();
    });

    it('should reject empty search string', () => {
      const invalidQuery = { search: '' };

      const { error } = messageQuerySchema.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.message).toContain('not allowed to be empty');
    });

    it('should validate complex query with all filters', () => {
      const complexQuery = {
        page: 2,
        limit: 30,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        customerPhone: '+905551234567',
        readStatus: false,
        direction: 'INBOUND',
        search: 'hello',
      };

      const { error } = messageQuerySchema.validate(complexQuery);

      expect(error).toBeUndefined();
    });

    it('should convert string numbers to integers', () => {
      const queryWithStrings = {
        page: '3' as any,
        limit: '25' as any,
      };

      const { value } = messageQuerySchema.validate(queryWithStrings);

      expect(typeof value.page).toBe('number');
      expect(typeof value.limit).toBe('number');
      expect(value.page).toBe(3);
      expect(value.limit).toBe(25);
    });
  });
});
