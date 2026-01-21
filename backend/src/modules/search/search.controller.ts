import { Request, Response, NextFunction } from 'express';
import { searchService, SearchParams, SavedSearchInput } from './search.service';
import { AppError } from '../../middleware/errorHandler';
import { SearchEntity } from '@prisma/client';

class SearchController {
  // Perform search
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity, filters, sortBy, sortOrder, page, limit } = req.body;

      if (!entity || !filters) {
        throw new AppError('Entity and filters are required', 400);
      }

      // Validate entity
      if (!Object.values(SearchEntity).includes(entity)) {
        throw new AppError('Invalid entity type', 400);
      }

      const searchParams: SearchParams = {
        entity,
        filters,
        sortBy,
        sortOrder,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      // Apply role-based filtering
      if (req.user!.role === 'CLIENT') {
        searchParams.userId = req.user!.id;
      }

      const result = await searchService.search(searchParams);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Quick search (GET endpoint with query params)
  async quickSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity, q, field = 'all', page = '1', limit = '20' } = req.query;

      if (!entity || !q) {
        throw new AppError('Entity and search query (q) are required', 400);
      }

      // Build filters based on entity and field
      const filters = this.buildQuickSearchFilters(
        entity as SearchEntity,
        field as string,
        q as string
      );

      const searchParams: SearchParams = {
        entity: entity as SearchEntity,
        filters,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      // Apply role-based filtering
      if (req.user!.role === 'CLIENT') {
        searchParams.userId = req.user!.id;
      }

      const result = await searchService.search(searchParams);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Build quick search filters
  private buildQuickSearchFilters(entity: SearchEntity, field: string, query: string): any[] {
    const filters: any[] = [];

    switch (entity) {
      case 'MESSAGES':
        if (field === 'all') {
          filters.push(
            { field: 'messageContent', operator: 'contains', value: query },
            { field: 'customerName', operator: 'contains', value: query },
            { field: 'customerPhone', operator: 'contains', value: query }
          );
        } else {
          filters.push({ field, operator: 'contains', value: query });
        }
        break;

      case 'CUSTOMERS':
        if (field === 'all' || field === 'name') {
          filters.push({ field: 'name', operator: 'contains', value: query });
        }
        if (field === 'all' || field === 'phone') {
          filters.push({ field: 'phone', operator: 'contains', value: query });
        }
        break;

      case 'PAYMENTS':
        if (field === 'all') {
          filters.push({ field: 'status', operator: 'contains', value: query });
        } else {
          filters.push({ field, operator: 'contains', value: query });
        }
        break;

      case 'SUBSCRIPTIONS':
        if (field === 'all') {
          filters.push({ field: 'planName', operator: 'contains', value: query });
        } else {
          filters.push({ field, operator: 'contains', value: query });
        }
        break;
    }

    return filters;
  }

  // Create saved search
  async createSavedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const input: SavedSearchInput = req.body;

      if (!input.name || !input.entity || !input.filters) {
        throw new AppError('Name, entity, and filters are required', 400);
      }

      const savedSearch = await searchService.createSavedSearch(req.user!.id, input);

      res.status(201).json(savedSearch);
    } catch (error) {
      next(error);
    }
  }

  // Get saved searches
  async getSavedSearches(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity } = req.query;

      const savedSearches = await searchService.getSavedSearches(
        req.user!.id,
        entity as SearchEntity | undefined
      );

      res.json(savedSearches);
    } catch (error) {
      next(error);
    }
  }

  // Get saved search by ID
  async getSavedSearchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const savedSearch = await searchService.getSavedSearchById(id, req.user!.id);

      if (!savedSearch) {
        throw new AppError('Saved search not found', 404);
      }

      res.json(savedSearch);
    } catch (error) {
      next(error);
    }
  }

  // Update saved search
  async updateSavedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: Partial<SavedSearchInput> = req.body;

      const result = await searchService.updateSavedSearch(id, req.user!.id, input);

      if (result.count === 0) {
        throw new AppError('Saved search not found', 404);
      }

      res.json({ message: 'Saved search updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Delete saved search
  async deleteSavedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await searchService.deleteSavedSearch(id, req.user!.id);

      if (result.count === 0) {
        throw new AppError('Saved search not found', 404);
      }

      res.json({ message: 'Saved search deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Execute saved search
  async executeSavedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page, limit, sortBy, sortOrder } = req.query;

      const additionalParams = {
        ...(page && { page: parseInt(page as string) }),
        ...(limit && { limit: parseInt(limit as string) }),
        ...(sortBy && { sortBy: sortBy as string }),
        ...(sortOrder && { sortOrder: sortOrder as 'asc' | 'desc' })
      };

      const result = await searchService.executeSavedSearch(
        id,
        req.user!.id,
        additionalParams
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get search fields for entity
  async getSearchFields(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity } = req.params;

      const fields = this.getEntityFields(entity as SearchEntity);

      res.json(fields);
    } catch (error) {
      next(error);
    }
  }

  // Get available search fields for each entity
  private getEntityFields(entity: SearchEntity): any {
    const fieldDefinitions: Record<SearchEntity, any[]> = {
      MESSAGES: [
        { name: 'messageContent', label: 'Mesaj İçeriği', type: 'string' },
        { name: 'customerName', label: 'Müşteri Adı', type: 'string' },
        { name: 'customerPhone', label: 'Telefon', type: 'string' },
        { name: 'direction', label: 'Yön', type: 'enum', options: ['INBOUND', 'OUTBOUND'] },
        { name: 'messageType', label: 'Tip', type: 'string' },
        { name: 'readStatus', label: 'Okundu', type: 'boolean' },
        { name: 'timestamp', label: 'Tarih', type: 'datetime' }
      ],
      CUSTOMERS: [
        { name: 'name', label: 'Ad', type: 'string' },
        { name: 'phone', label: 'Telefon', type: 'string' },
        { name: 'messageCount', label: 'Mesaj Sayısı', type: 'number' },
        { name: 'lastActivity', label: 'Son Aktivite', type: 'datetime' }
      ],
      PAYMENTS: [
        { name: 'amount', label: 'Tutar', type: 'number' },
        { name: 'status', label: 'Durum', type: 'enum', options: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
        { name: 'paymentMethod', label: 'Ödeme Yöntemi', type: 'string' },
        { name: 'paymentDate', label: 'Ödeme Tarihi', type: 'date' },
        { name: 'currency', label: 'Para Birimi', type: 'string' }
      ],
      SUBSCRIPTIONS: [
        { name: 'planName', label: 'Plan', type: 'string' },
        { name: 'status', label: 'Durum', type: 'enum', options: ['ACTIVE', 'SUSPENDED', 'CANCELLED'] },
        { name: 'monthlyPrice', label: 'Aylık Fiyat', type: 'number' },
        { name: 'startDate', label: 'Başlangıç', type: 'date' },
        { name: 'endDate', label: 'Bitiş', type: 'date' },
        { name: 'autoRenew', label: 'Otomatik Yenileme', type: 'boolean' }
      ]
    };

    return {
      entity,
      fields: fieldDefinitions[entity] || [],
      operators: [
        { value: 'equals', label: 'Eşittir', types: ['string', 'number', 'enum', 'boolean'] },
        { value: 'contains', label: 'İçerir', types: ['string'] },
        { value: 'startsWith', label: 'Başlar', types: ['string'] },
        { value: 'endsWith', label: 'Biter', types: ['string'] },
        { value: 'gt', label: 'Büyüktür', types: ['number', 'date', 'datetime'] },
        { value: 'gte', label: 'Büyük veya Eşit', types: ['number', 'date', 'datetime'] },
        { value: 'lt', label: 'Küçüktür', types: ['number', 'date', 'datetime'] },
        { value: 'lte', label: 'Küçük veya Eşit', types: ['number', 'date', 'datetime'] },
        { value: 'in', label: 'İçinde', types: ['string', 'enum'] },
        { value: 'between', label: 'Arasında', types: ['number', 'date', 'datetime'] }
      ]
    };
  }
}

export const searchController = new SearchController();
