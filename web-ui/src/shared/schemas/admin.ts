import { z } from 'zod';

// Generate Test Data Schemas
export const GenerateTestDataRequestSchema = z.object({
  userCount: z.coerce.number().min(1).max(20).default(5),
  postsPerUser: z.coerce.number().min(1).max(10).default(3),
});

export const UserSummarySchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  postsCount: z.number(),
});

export const GenerateTestDataResponseSchema = z.object({
  statusCode: z.number(),
  body: z.object({
    message: z.string(),
    summary: z.object({
      usersCreated: z.number(),
      postsCreated: z.number(),
      totalItems: z.number(),
    }),
    users: z.array(UserSummarySchema),
    timestamp: z.string(),
  }),
});

// Export types
export type GenerateTestDataRequest = z.infer<typeof GenerateTestDataRequestSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type GenerateTestDataResponse = z.infer<typeof GenerateTestDataResponseSchema>;

// Validation helpers - single responsibility functions
export const validateGenerateTestDataRequest = (data: unknown): GenerateTestDataRequest => {
  return GenerateTestDataRequestSchema.parse(data);
};

export const validateGenerateTestDataResponse = (data: unknown): GenerateTestDataResponse => {
  return GenerateTestDataResponseSchema.parse(data);
};