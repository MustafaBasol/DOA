import { Request, Response } from 'express';
import { messageTemplateService } from '../services/message-template.service';

/**
 * Create a new template
 */
export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, content, language, category } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const template = await messageTemplateService.createTemplate({
      name,
      content,
      language: language || 'TR',
      category: category || 'general',
      createdById: userId,
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Create template error:', error);
    res.status(500).json({ error: error.message || 'Failed to create template' });
  }
};

/**
 * Get all templates
 */
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, language, status, search } = req.query;

    const templates = await messageTemplateService.getTemplates({
      category: category as string,
      language: language as string,
      status: status as string,
      search: search as string,
    });

    res.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: error.message || 'Failed to get templates' });
  }
};

/**
 * Get template by ID
 */
export const getTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await messageTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Get template error:', error);
    res.status(500).json({ error: error.message || 'Failed to get template' });
  }
};

/**
 * Update template
 */
export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { name, content, language, category, status } = req.body;

    const template = await messageTemplateService.updateTemplate(id, {
      name,
      content,
      language,
      category,
      status,
    });

    res.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Update template error:', error);
    res.status(500).json({ error: error.message || 'Failed to update template' });
  }
};

/**
 * Delete template
 */
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    await messageTemplateService.deleteTemplate(id);

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete template' });
  }
};

/**
 * Preview template with variables
 */
export const previewTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, variables } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const rendered = messageTemplateService.renderTemplate(content, variables || {});

    res.json({
      success: true,
      rendered,
    });
  } catch (error: any) {
    console.error('Preview template error:', error);
    res.status(500).json({ error: error.message || 'Failed to preview template' });
  }
};

/**
 * Duplicate template
 */
export const duplicateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    const template = await messageTemplateService.duplicateTemplate(id, userId);

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Duplicate template error:', error);
    res.status(500).json({ error: error.message || 'Failed to duplicate template' });
  }
};

/**
 * Get template statistics
 */
export const getTemplateStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const stats = await messageTemplateService.getTemplateStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Get template stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get stats' });
  }
};

/**
 * Search templates
 */
export const searchTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const templates = await messageTemplateService.searchTemplates(q);

    res.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Search templates error:', error);
    res.status(500).json({ error: error.message || 'Failed to search templates' });
  }
};
