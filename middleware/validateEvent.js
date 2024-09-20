import { body } from 'express-validator';

export const validateCreateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
];

export const validateUpdateEvent = [
  body('title').optional().notEmpty().withMessage('Title is required'),
  body('description').optional().notEmpty().withMessage('Description is required'),
  body('date').optional().isDate().withMessage('Valid date is required'),
  body('location').optional().notEmpty().withMessage('Location is required'),
  body('category').optional().notEmpty().withMessage('Category is required'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
];
