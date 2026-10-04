export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E; message?: string; details?: unknown };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E = string>(
  error: E,
  message?: string,
  details?: unknown,
): Result<never, E> {
  return { success: false, error, message, details };
}
