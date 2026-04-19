import { z } from 'zod';

export const SignupSchema = z.object({
  email: z
    .string({ message: 'Please enter your email.' })
    .trim()
    .toLowerCase()
    .email('That doesn’t look like a valid email.'),
  name: z
    .string()
    .trim()
    .max(60, 'Please keep it under 60 characters.')
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const CheckinSchema = z.object({
  reflect: z.string().max(2000, 'That’s a lot — try trimming to under 2000 characters.').default(''),
  gratitude: z.string().max(2000, 'That’s a lot — try trimming to under 2000 characters.').default(''),
  intention: z.string().max(2000, 'That’s a lot — try trimming to under 2000 characters.').default(''),
});
export type CheckinInput = z.infer<typeof CheckinSchema>;

export const DraftSchema = CheckinSchema.partial();
export type DraftInput = z.infer<typeof DraftSchema>;

export const ResendSchema = z.object({
  email: z.string().trim().toLowerCase().email('That doesn’t look like a valid email.'),
});

/**
 * Turn a ZodError into a flat { field: message } object for friendly inline UI rendering.
 */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
