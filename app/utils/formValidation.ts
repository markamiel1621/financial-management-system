import type { FormErrorEvent, FormInputEvents } from '@nuxt/ui'

// Validate while editing and on submit so clearing an error on blur cannot move the pressed button.
export const formValidation = {
  novalidate: true,
  validateOn: ['input'] satisfies FormInputEvents[],
  validateOnInputDelay: 0,
  onError({ errors }: FormErrorEvent) {
    const id = errors[0]?.id
    // UForm re-enables its inputs after it emits the validation error.
    if (id) requestAnimationFrame(() => document.getElementById(id)?.focus())
  },
}
