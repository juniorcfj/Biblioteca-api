import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  copies: z.number().int().min(1).max(1000),
});

export const createLoanSchema = z.object({
  bookId: z.string().min(1),
  borrower: z.string().trim().min(1).max(200),
});
