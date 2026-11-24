// Pack the generated Nuxt application, including all lazy routes, into one offline file.
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const publicDir = resolve(root, '.output/public')
const html = await Bun.file(resolve(publicDir, 'index.html')).text()
const stylesheet = html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)
const entry = html.match(/<script\b[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)
if (!stylesheet?.[1] || !entry?.[1])
  throw new Error('The generated page must contain one stylesheet and a module entry.')

const file = (asset: string) => resolve(publicDir, '.' + asset)
const bundle = await Bun.build({
  entrypoints: [file(entry[1])],
  target: 'browser',
  format: 'esm',
  splitting: false,
  minify: true,
})
if (!bundle.success || bundle.outputs.length !== 1)
  throw new Error('Cannot bundle the presentation: ' + bundle.logs.join('\n'))

const css = await Bun.file(file(stylesheet[1])).text()
const code = (await bundle.outputs[0]!.text()).replace(/<\/script/gi, '<\\/script')
const sample = (await Bun.file(resolve(publicDir, 'api/demo.json')).text()).replace(/</g, '\\u003c')
const offline = html
  .replace(stylesheet[0], () => '<style>' + css + '</style>')
  .replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')
  .replace(entry[0], '')
  .replace(
    '</body>',
    () =>
      '<script id="folio-sample-data" type="application/json">' +
      sample +
      '</script><script type="module">' +
      code +
      '</script></body>',
  )

const directory = resolve(root, 'presentation')
await mkdir(directory, { recursive: true })
await Bun.write(resolve(directory, 'FMS-Presentation.html'), offline)
console.log('Offline presentation ready at presentation/FMS-Presentation.html')
