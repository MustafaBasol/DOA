import { searchService } from '../../src/modules/search/search.service';
import { prismaMock } from '../setup';

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchMessages', () => {
    it('should search messages with filters and pagination', async () => {
      const mockMessages = [
        {
          id: '1',
          customerPhone: '+905551234567',
          customerName: 'Ahmet Yılmaz',
          content: 'Test mesajı',
          timestamp: new Date('2024-01-15'),
          userId: 'user1',
          user: { id: 'user1', fullName: 'Admin User', companyName: 'Test Ltd', email: 'admin@test.com' }
        }
      ];

      prismaMock.whatsappMessage.findMany.mockResolvedValue(mockMessages as any);
      prismaMock.whatsappMessage.count.mockResolvedValue(1);

      const result = await searchService.search({
        entity: 'MESSAGES',
        filters: [
          { field: 'customerPhone', operator: 'contains', value: '555' }
        ],
        page: 1,
        limit: 20
      });

      expect(result).toEqual({
        data: mockMessages,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      });
      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerPhone: { contains: '555', mode: 'insensitive' }
          }),
          skip: 0,
          take: 20
        })
      );
    });

    it('should apply userId filter for CLIENT role', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await searchService.search({
        entity: 'MESSAGES',
        filters: [],
        userId: 'client1'
      });

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'client1'
          })
        })
      );
    });

    it('should support different filter operators (equals, startsWith, endsWith)', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await searchService.search({
        entity: 'MESSAGES',
        filters: [
          { field: 'direction', operator: 'equals', value: 'INBOUND' },
          { field: 'customerName', operator: 'startsWith', value: 'Ahmet' },
          { field: 'customerPhone', operator: 'endsWith', value: '4567' }
        ]
      });

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            direction: 'INBOUND',
            customerName: { startsWith: 'Ahmet', mode: 'insensitive' },
            customerPhone: { endsWith: '4567', mode: 'insensitive' }
          }
        })
      );
    });

    it('should support numeric comparison operators (gt, gte, lt, lte)', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await searchService.search({
        entity: 'MESSAGES',
        filters: [
          { field: 'timestamp', operator: 'between', value: [startDate, endDate] }
        ]
      });

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      );
    });

    it('should support "in" operator with arrays', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await searchService.search({
        entity: 'MESSAGES',
        filters: [
          { field: 'direction', operator: 'in', value: ['INBOUND', 'OUTBOUND'] }
        ]
      });

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            direction: { in: ['INBOUND', 'OUTBOUND'] }
          }
        })
      );
    });

    it('should support "between" operator with date range', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await searchService.search({
        entity: 'MESSAGES',
        filters: [
          { field: 'timestamp', operator: 'between', value: [startDate, endDate] }
        ]
      });

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            timestamp: { gte: startDate, lte: endDate }
          }
        })
      );
    });

    it('should support custom sorting', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await searchService.search({
        entity: 'MESSAGES',
        filters: [],
        sortBy: 'customerName',
        sortOrder: 'asc'
      });

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { customerName: 'asc' }
        })
      );
    });

    it('should calculate totalPages correctly', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(47);

      const result = await searchService.search({
        entity: 'MESSAGES',
        filters: [],
        page: 2,
        limit: 10
      });

      expect(result.totalPages).toBe(5); // Math.ceil(47 / 10)
      expect(result.page).toBe(2);
      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10
        })
      );
    });
  });

  describe('searchCustomers', () => {
    it('should search customers with groupBy and message counts', async () => {
      const mockCustomers = [
        {
          customerPhone: '+905551234567',
          customerName: 'Ahmet Yılmaz',
          userId: 'user1',
          _count: { id: 5 },
          _max: { timestamp: new Date('2024-01-15') }
        }
      ];

      const mockUser = {
        id: 'user1',
        fullName: 'Admin User',
        companyName: 'Test Ltd',
        email: 'admin@test.com'
      };

      prismaMock.whatsappMessage.groupBy.mockResolvedValue(mockCustomers as any);
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await searchService.search({
        entity: 'CUSTOMERS',
        filters: [
          { field: 'phone', operator: 'contains', value: '555' }
        ],
        page: 1,
        limit: 20
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        customerPhone: '+905551234567',
        customerName: 'Ahmet Yılmaz',
        messageCount: 5,
        lastActivity: mockCustomers[0]._max.timestamp,
        user: mockUser
      });
      expect(prismaMock.whatsappMessage.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['customerPhone', 'customerName', 'userId'],
          where: {
            customerPhone: { contains: '555', mode: 'insensitive' }
          }
        })
      );
    });

    it('should map customer field filters correctly', async () => {
      prismaMock.whatsappMessage.groupBy.mockResolvedValue([]);

      await searchService.search({
        entity: 'CUSTOMERS',
        filters: [
          { field: 'name', operator: 'startsWith', value: 'Ahmet' },
          { field: 'phone', operator: 'contains', value: '555' }
        ]
      });

      expect(prismaMock.whatsappMessage.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            customerName: { startsWith: 'Ahmet', mode: 'insensitive' },
            customerPhone: { contains: '555', mode: 'insensitive' }
          }
        })
      );
    });

    it('should support sorting by messageCount', async () => {
      prismaMock.whatsappMessage.groupBy.mockResolvedValue([]);

      await searchService.search({
        entity: 'CUSTOMERS',
        filters: [],
        sortBy: 'messageCount',
        sortOrder: 'desc'
      });

      expect(prismaMock.whatsappMessage.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { _count: { id: 'desc' } }
        })
      );
    });

    it('should handle pagination with slice for customers', async () => {
      const mockCustomers = Array.from({ length: 25 }, (_, i) => ({
        customerPhone: `+90555000${i}`,
        customerName: `Customer ${i}`,
        userId: 'user1',
        _count: { id: 3 },
        _max: { timestamp: new Date() }
      }));

      prismaMock.whatsappMessage.groupBy.mockResolvedValue(mockCustomers as any);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        fullName: 'Test User',
        companyName: 'Test',
        email: 'test@test.com'
      } as any);

      const result = await searchService.search({
        entity: 'CUSTOMERS',
        filters: [],
        page: 2,
        limit: 10
      });

      expect(result.total).toBe(25);
      expect(result.data).toHaveLength(10);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(2);
    });
  });

  describe('searchPayments', () => {
    it('should search payments with filters and includes', async () => {
      const mockPayments = [
        {
          id: 'pay1',
          amount: 299,
          status: 'COMPLETED',
          userId: 'user1',
          user: { id: 'user1', fullName: 'Test User', companyName: 'Test', email: 'test@test.com' },
          subscription: { id: 'sub1', planName: 'Pro', monthlyPrice: 299 }
        }
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);
      prismaMock.payment.count.mockResolvedValue(1);

      const result = await searchService.search({
        entity: 'PAYMENTS',
        filters: [
          { field: 'status', operator: 'equals', value: 'COMPLETED' }
        ],
        page: 1,
        limit: 20
      });

      expect(result.data).toEqual(mockPayments);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'COMPLETED' },
          include: expect.objectContaining({
            user: expect.any(Object),
            subscription: expect.any(Object)
          })
        })
      );
    });

    it('should apply userId filter for payments', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await searchService.search({
        entity: 'PAYMENTS',
        filters: [],
        userId: 'client1'
      });

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'client1' }
        })
      );
    });

    it('should support amount range filters', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await searchService.search({
        entity: 'PAYMENTS',
        filters: [
          { field: 'amount', operator: 'between', value: [100, 500] }
        ]
      });

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            amount: {
              gte: 100,
              lte: 500
            }
          }
        })
      );
    });
  });

  describe('searchSubscriptions', () => {
    it('should search subscriptions with filters and payment counts', async () => {
      const mockSubscriptions = [
        {
          id: 'sub1',
          planName: 'Pro',
          status: 'ACTIVE',
          userId: 'user1',
          user: { id: 'user1', fullName: 'Test User', companyName: 'Test', email: 'test@test.com' },
          _count: { payments: 3 }
        }
      ];

      prismaMock.subscription.findMany.mockResolvedValue(mockSubscriptions as any);
      prismaMock.subscription.count.mockResolvedValue(1);

      const result = await searchService.search({
        entity: 'SUBSCRIPTIONS',
        filters: [
          { field: 'status', operator: 'equals', value: 'ACTIVE' }
        ],
        page: 1,
        limit: 20
      });

      expect(result.data).toEqual(mockSubscriptions);
      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
          include: expect.objectContaining({
            user: expect.any(Object),
            _count: { select: { payments: true } }
          })
        })
      );
    });

    it('should apply userId filter for subscriptions', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.subscription.count.mockResolvedValue(0);

      await searchService.search({
        entity: 'SUBSCRIPTIONS',
        filters: [],
        userId: 'client1'
      });

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'client1' }
        })
      );
    });
  });

  describe('search - universal method', () => {
    it('should throw error for unsupported entity', async () => {
      await expect(
        searchService.search({
          entity: 'INVALID' as any,
          filters: []
        })
      ).rejects.toThrow('Unsupported entity: INVALID');
    });
  });

  describe('createSavedSearch', () => {
    it('should create saved search', async () => {
      const mockSavedSearch = {
        id: 'saved1',
        userId: 'user1',
        name: 'Active Subscriptions',
        entity: 'SUBSCRIPTIONS',
        filters: [{ field: 'status', operator: 'equals', value: 'ACTIVE' }],
        isDefault: false
      };

      prismaMock.savedSearch.create.mockResolvedValue(mockSavedSearch as any);

      const result = await searchService.createSavedSearch('user1', {
        name: 'Active Subscriptions',
        entity: 'SUBSCRIPTIONS',
        filters: [{ field: 'status', operator: 'equals', value: 'ACTIVE' }]
      });

      expect(result).toEqual(mockSavedSearch);
      expect(prismaMock.savedSearch.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          name: 'Active Subscriptions',
          description: undefined,
          entity: 'SUBSCRIPTIONS',
          filters: [{ field: 'status', operator: 'equals', value: 'ACTIVE' }],
          isDefault: false
        }
      });
    });

    it('should unset other defaults when setting new default', async () => {
      prismaMock.savedSearch.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.savedSearch.create.mockResolvedValue({
        id: 'saved1',
        userId: 'user1',
        name: 'Default Search',
        entity: 'MESSAGES',
        filters: [],
        isDefault: true
      } as any);

      await searchService.createSavedSearch('user1', {
        name: 'Default Search',
        entity: 'MESSAGES',
        filters: [],
        isDefault: true
      });

      expect(prismaMock.savedSearch.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          entity: 'MESSAGES',
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    });
  });

  describe('getSavedSearches', () => {
    it('should get all saved searches for user', async () => {
      const mockSearches = [
        { id: 'saved1', name: 'Search 1', entity: 'MESSAGES', isDefault: true },
        { id: 'saved2', name: 'Search 2', entity: 'PAYMENTS', isDefault: false }
      ];

      prismaMock.savedSearch.findMany.mockResolvedValue(mockSearches as any);

      const result = await searchService.getSavedSearches('user1');

      expect(result).toEqual(mockSearches);
      expect(prismaMock.savedSearch.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
      });
    });

    it('should filter saved searches by entity', async () => {
      prismaMock.savedSearch.findMany.mockResolvedValue([]);

      await searchService.getSavedSearches('user1', 'MESSAGES');

      expect(prismaMock.savedSearch.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', entity: 'MESSAGES' },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
      });
    });
  });

  describe('getSavedSearchById', () => {
    it('should get saved search by id and userId', async () => {
      const mockSearch = {
        id: 'saved1',
        userId: 'user1',
        name: 'My Search',
        entity: 'MESSAGES',
        filters: []
      };

      prismaMock.savedSearch.findFirst.mockResolvedValue(mockSearch as any);

      const result = await searchService.getSavedSearchById('saved1', 'user1');

      expect(result).toEqual(mockSearch);
      expect(prismaMock.savedSearch.findFirst).toHaveBeenCalledWith({
        where: { id: 'saved1', userId: 'user1' }
      });
    });
  });

  describe('updateSavedSearch', () => {
    it('should update saved search', async () => {
      prismaMock.savedSearch.updateMany.mockResolvedValue({ count: 1 } as any);

      await searchService.updateSavedSearch('saved1', 'user1', {
        name: 'Updated Name'
      });

      expect(prismaMock.savedSearch.updateMany).toHaveBeenCalledWith({
        where: { id: 'saved1', userId: 'user1' },
        data: { name: 'Updated Name' }
      });
    });

    it('should unset other defaults when updating to default', async () => {
      prismaMock.savedSearch.findFirst.mockResolvedValue({
        id: 'saved1',
        userId: 'user1',
        entity: 'MESSAGES'
      } as any);
      prismaMock.savedSearch.updateMany.mockResolvedValue({ count: 1 } as any);

      await searchService.updateSavedSearch('saved1', 'user1', {
        isDefault: true
      });

      expect(prismaMock.savedSearch.updateMany).toHaveBeenCalledTimes(2);
      expect(prismaMock.savedSearch.updateMany).toHaveBeenNthCalledWith(1, {
        where: {
          userId: 'user1',
          entity: 'MESSAGES',
          isDefault: true,
          id: { not: 'saved1' }
        },
        data: { isDefault: false }
      });
    });
  });

  describe('deleteSavedSearch', () => {
    it('should delete saved search', async () => {
      prismaMock.savedSearch.deleteMany.mockResolvedValue({ count: 1 } as any);

      await searchService.deleteSavedSearch('saved1', 'user1');

      expect(prismaMock.savedSearch.deleteMany).toHaveBeenCalledWith({
        where: { id: 'saved1', userId: 'user1' }
      });
    });
  });

  describe('executeSavedSearch', () => {
    it('should execute saved search with stored filters', async () => {
      const mockSavedSearch = {
        id: 'saved1',
        userId: 'user1',
        entity: 'MESSAGES',
        filters: [{ field: 'direction', operator: 'equals', value: 'INBOUND' }]
      };

      prismaMock.savedSearch.findFirst.mockResolvedValue(mockSavedSearch as any);
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await searchService.executeSavedSearch('saved1', 'user1');

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            direction: 'INBOUND',
            userId: 'user1'
          })
        })
      );
    });

    it('should throw error if saved search not found', async () => {
      prismaMock.savedSearch.findFirst.mockResolvedValue(null);

      await expect(
        searchService.executeSavedSearch('nonexistent', 'user1')
      ).rejects.toThrow('Saved search not found');
    });

    it('should merge additional params with saved search', async () => {
      const mockSavedSearch = {
        id: 'saved1',
        userId: 'user1',
        entity: 'MESSAGES',
        filters: [{ field: 'direction', operator: 'equals', value: 'INBOUND' }]
      };

      prismaMock.savedSearch.findFirst.mockResolvedValue(mockSavedSearch as any);
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await searchService.executeSavedSearch('saved1', 'user1', {
        page: 2,
        limit: 10,
        sortBy: 'timestamp',
        sortOrder: 'asc'
      });

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          orderBy: { timestamp: 'asc' }
        })
      );
    });
  });
});
