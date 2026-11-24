import { resolveAppName } from '../../shared/config'

export default defineNitroPlugin((nitro) => {
  // Set the initial HTML title before the client app mounts.
  nitro.hooks.hook('render:html', (html, { event }) => {
    const appName = resolveAppName(useRuntimeConfig(event).public.appName)
    const title = appName.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    html.head.push(`<title>${title}</title>`)
  })
})
