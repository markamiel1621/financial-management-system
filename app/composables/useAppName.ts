import { resolveAppName } from '#shared/config'

export function useAppName(): string {
  return resolveAppName(useRuntimeConfig().public.appName)
}
