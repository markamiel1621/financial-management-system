export default defineAppConfig({
  ui: {
    colors: { primary: 'violet', neutral: 'slate' },
    card: { slots: { root: 'min-w-0 rounded-2xl', body: 'grid content-start gap-4' } },
    form: { base: 'grid gap-4' },
    button: { defaultVariants: { size: 'lg' } },
    input: { slots: { root: 'w-full' }, defaultVariants: { size: 'lg' } },
    select: { defaultVariants: { size: 'lg' } },
    textarea: { slots: { root: 'w-full' }, defaultVariants: { size: 'lg' } },
  },
})
