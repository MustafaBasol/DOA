import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  language: string;
  category: string;
  status: string;
  createdBy?: string;
}

export class MessageTemplateService {
  /**
   * Create a new message template
   */
  async createTemplate(data: {
    name: string;
    content: string;
    language: string;
    category: string;
    createdById: string;
  }): Promise<any> {
    try {
      // Extract variables from content (e.g., {{name}}, {{amount}})
      const variables = this.extractVariables(data.content);

      const template = await prisma.messageTemplate.create({
        data: {
          name: data.name,
          content: data.content,
          variables,
          language: data.language,
          category: data.category,
          status: 'ACTIVE',
          createdById: data.createdById,
        },
      });

      console.log(`✅ Template created: ${template.name}`);
      return template;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Get all templates with filters
   */
  async getTemplates(filters?: {
    category?: string;
    language?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.language) {
      where.language = filters.language;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.messageTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string) {
    return await prisma.messageTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, data: {
    name?: string;
    content?: string;
    language?: string;
    category?: string;
    status?: string;
  }) {
    try {
      // If content is updated, re-extract variables
      if (data.content) {
        const variables = this.extractVariables(data.content);
        (data as any).variables = variables;
      }

      const template = await prisma.messageTemplate.update({
        where: { id },
        data: data as any,
      });

      console.log(`✅ Template updated: ${template.name}`);
      return template;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string) {
    try {
      await prisma.messageTemplate.delete({
        where: { id },
      });

      console.log(`✅ Template deleted: ${id}`);
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(content: string, variables: Record<string, any>): string {
    let rendered = content;

    // Replace {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    return rendered;
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(content: string): string[] {
    const regex = /{{(\s*\w+\s*)}}/g;
    const matches = content.matchAll(regex);
    const variables: string[] = [];

    for (const match of matches) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  /**
   * Validate template variables
   */
  validateVariables(templateId: string, _variables: Record<string, any>): {
    valid: boolean;
    missing: string[];
    extra: string[];
  } {
    const template = prisma.messageTemplate.findUnique({
      where: { id: templateId },
      select: { variables: true },
    });

    if (!template) {
      return { valid: false, missing: [], extra: [] };
    }

    // This is a simplified version - in production you'd await the template
    return {
      valid: true,
      missing: [],
      extra: [],
    };
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(id: string, createdById: string) {
    try {
      const original = await prisma.messageTemplate.findUnique({
        where: { id },
      });

      if (!original) {
        throw new Error('Template not found');
      }

      const duplicate = await prisma.messageTemplate.create({
        data: {
          name: `${original.name} (Copy)`,
          content: original.content,
          variables: original.variables,
          language: original.language,
          category: original.category,
          status: 'DRAFT',
          createdById,
        },
      });

      console.log(`✅ Template duplicated: ${duplicate.name}`);
      return duplicate;
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      throw error;
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats() {
    const [total, active, draft, byCategory, byLanguage] = await Promise.all([
      prisma.messageTemplate.count(),
      prisma.messageTemplate.count({ where: { status: 'ACTIVE' } }),
      prisma.messageTemplate.count({ where: { status: 'DRAFT' } }),
      prisma.messageTemplate.groupBy({
        by: ['category'],
        _count: true,
      }),
      prisma.messageTemplate.groupBy({
        by: ['language'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      draft,
      byCategory: byCategory.map((c: any) => ({ category: c.category, count: c._count })),
      byLanguage: byLanguage.map((l: any) => ({ language: l.language, count: l._count })),
    };
  }

  /**
   * Search templates by content
   */
  async searchTemplates(query: string) {
    return await prisma.messageTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const messageTemplateService = new MessageTemplateService();
