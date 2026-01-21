import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: Joi.ObjectSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = source === 'query' ? req.query : req.body;
    const { error } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        error: 'Validation error',
        details: errors,
      });
      return;
    }

    next();
  };
}
