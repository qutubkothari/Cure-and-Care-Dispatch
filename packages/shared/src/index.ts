import { z } from 'zod';

export const userRoleSchema = z.enum([
  'ADMIN',
  'SUPERVISOR',
  'DISPATCHER',
  'AGENT',
  'ACCOUNTANT'
]);

export type UserRole = z.infer<typeof userRoleSchema>;

export const dispatchJobStatusSchema = z.enum([
  'ASSIGNED',
  'STARTED',
  'DELIVERED',
  'FAILED',
  'CANCELLED'
]);

export type DispatchJobStatus = z.infer<typeof dispatchJobStatusSchema>;

export const gpsPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().nonnegative().optional(),
  provider: z.string().optional()
});

export type GpsPoint = z.infer<typeof gpsPointSchema>;
