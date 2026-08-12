import { z } from 'zod';

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER']).optional(),
});

// Column Configuration Schema
export const columnConfigSchema = z.object({
  entityType: z.enum(['campaign', 'adset', 'ad']),
  key: z.string().min(1, 'Key is required').regex(/^[a-zA-Z0-9_]+$/, 'Key must be alphanumeric/underscores'),
  label: z.string().min(1, 'Label is required'),
  type: z.enum([
    'text',
    'number',
    'currency',
    'percentage',
    'date',
    'datetime',
    'boolean',
    'status',
    'select',
    'image',
    'link',
  ]),
  visible: z.boolean().optional(),
  editable: z.boolean().optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  order: z.number().int().nonnegative(),
});

export const columnConfigUpdateSchema = columnConfigSchema.partial();

// Campaign Schemas
export const campaignCreateSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  campaignId: z.string().optional(),
  delivery: z.string().optional(),
  bidStrategy: z.string().optional(),
  budget: z.number().nonnegative('Budget must be greater than or equal to 0').optional(),
  budgetType: z.enum(['Daily', 'Lifetime']).optional(),
  results: z.number().int().nonnegative().optional(),
  resultType: z.string().optional(),
  reach: z.number().int().nonnegative().optional(),
  impressions: z.number().int().nonnegative().optional(),
  costPerResult: z.number().nonnegative().optional(),
  amountSpent: z.number().nonnegative().optional(),
  ends: z.string().optional(),
  frequency: z.number().nonnegative().optional(),
  status: z.enum(['Active', 'Off', 'Payment error', 'Draft', 'Paused']).optional(),
}).passthrough(); // Allows custom dynamic fields

export const campaignUpdateSchema = campaignCreateSchema.partial().passthrough();

// AdSet Schemas
export const adSetCreateSchema = z.object({
  name: z.string().min(1, 'AdSet name is required'),
  adSetId: z.string().optional(),
  campaignId: z.string().min(1, 'Campaign reference ID is required'),
  delivery: z.string().optional(),
  bidStrategy: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  budgetType: z.enum(['Daily', 'Lifetime']).optional(),
  results: z.number().int().nonnegative().optional(),
  resultType: z.string().optional(),
  reach: z.number().int().nonnegative().optional(),
  impressions: z.number().int().nonnegative().optional(),
  costPerResult: z.number().nonnegative().optional(),
  amountSpent: z.number().nonnegative().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['Active', 'Off', 'Payment error', 'Draft', 'Paused']).optional(),
}).passthrough();

export const adSetUpdateSchema = adSetCreateSchema.partial().passthrough();

// Ad Schemas
export const adCreateSchema = z.object({
  name: z.string().min(1, 'Ad name is required'),
  adId: z.string().optional(),
  adSetId: z.string().min(1, 'AdSet ID is required'),
  campaignId: z.string().min(1, 'Campaign ID is required'),
  delivery: z.string().optional(),
  adSetName: z.string().optional(),
  bidStrategy: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  lastSignificantEdit: z.string().optional(),
  results: z.number().int().nonnegative().optional(),
  resultType: z.string().optional(),
  reach: z.number().int().nonnegative().optional(),
  impressions: z.number().int().nonnegative().optional(),
  costPerResult: z.number().nonnegative().optional(),
  qualityRanking: z.string().optional(),
  engagementRateRanking: z.string().optional(),
  conversionRanking: z.string().optional(),
  amountSpent: z.number().nonnegative().optional(),
  status: z.enum(['Active', 'Off', 'Payment error', 'Draft', 'Paused']).optional(),
  image: z.string().optional(),
}).passthrough();

export const adUpdateSchema = adCreateSchema.partial().passthrough();

// User Schema (for Admin Panel CRUD)
export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER']),
});

export const userUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER']).optional(),
});
