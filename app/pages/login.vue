<script setup lang="ts">
import { personas, roleNames } from '#shared/config'
import { z } from 'zod'
import type { Role } from '#shared/types'
const { switchRole } = useFms()
const identities = Object.values(personas).map((person) => ({
  value: person.role,
  label: person.name + ' · ' + roleNames[person.role],
}))
const schema = z.object({ role: z.enum(identities.map((identity) => identity.value)) })
const state = reactive<{ role: Role }>({ role: 'employee' })
</script>
<template>
  <main class="standalone">
    <section class="panel login-card">
      <BrandMark />
      <p class="eyebrow">Financial Management System</p>
      <h1>Open a workspace</h1>
      <p class="muted">Choose a sample role to enter the presentation.</p>
      <UForm
        :schema="schema"
        :state="state"
        v-bind="formValidation"
        @submit="switchRole($event.data.role)"
      >
        <UFormField name="role" label="Demo identity" required>
          <USelect class="w-full" v-model="state.role" :items="identities" />
        </UFormField>
        <UButton type="submit" block>Enter demo</UButton>
      </UForm>
    </section>
  </main>
</template>
