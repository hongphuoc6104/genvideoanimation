/**
 * Dynamic resolution helper for motion-kit & validators across milestones
 */

export interface ResolvedModule<T> {
  module: T | null;
  isAvailable: boolean;
  missingExports: string[];
}

export async function resolveModule<T = any>(
  specifier: string,
  requiredExports: string[] = []
): Promise<ResolvedModule<T>> {
  try {
    const mod = await import(specifier);
    const missing = requiredExports.filter((exp) => !(exp in mod));
    return {
      module: mod as T,
      isAvailable: missing.length === 0,
      missingExports: missing,
    };
  } catch (err: any) {
    return {
      module: null,
      isAvailable: false,
      missingExports: requiredExports,
    };
  }
}

export async function resolveOptionalModule<T = any>(specifier: string): Promise<T | null> {
  try {
    return (await import(specifier)) as T;
  } catch (err: any) {
    if (
      err.code === 'ERR_MODULE_NOT_FOUND' ||
      err.code === 'MODULE_NOT_FOUND' ||
      (err.message && err.message.includes('Cannot find module'))
    ) {
      return null;
    }
    throw err;
  }
}
