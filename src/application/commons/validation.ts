import * as z from 'zod';
import { ValidationException } from '../exceptions/ValidationException';

export function validate<T extends z.ZodObject<any>>(schema: T, value: unknown) {
  const result = schema.safeParse(value);

  if (!result.success) {
    const { formErrors, fieldErrors } = z.flattenError(result.error);
    const errors = { ...parseFormErrors(formErrors), ...removeUndefined(fieldErrors) };
    throw new ValidationException('INVALID_INPUT_REQUEST_ERROR', 'Input invalid', errors);
  }
}

function parseFormErrors(errors: string[]): Record<string, string[]> {
  return Object.fromEntries(
    errors.map((err) => {
      const [message, quotedField] = err.split(': ');
      const field = quotedField.replace(/"/g, '');
      return [field, [message]];
    }),
  );
}

function removeUndefined<T>(obj: Record<string, T | undefined>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Record<string, T>;
}
