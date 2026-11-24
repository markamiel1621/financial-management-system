import { resolveAppName } from '../../shared/config'
import { createDemo } from '../../shared/demo/seed'

// Public presentation fixtures only. Interactive changes stay in the browser.
export default defineEventHandler((event) =>
  createDemo(resolveAppName(useRuntimeConfig(event).public.appName)),
)
