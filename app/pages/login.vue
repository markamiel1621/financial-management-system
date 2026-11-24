<script setup lang="ts">
import { personas, roleNames } from '#shared/config'
import type { Role } from '#shared/types'
const { switchRole } = useFms()
const selected = ref<Role>('employee')
</script>
<template>
  <main class="standalone">
    <section class="panel login-card">
      <BrandMark />
      <p class="eyebrow">Financial Management System</p>
      <h1>Open a workspace</h1>
      <p class="muted">Choose a sample role to enter the presentation.</p>
      <form @submit.prevent="switchRole(selected)">
        <label class="field">
          Demo identity
          <select v-model="selected">
            <option v-for="person in personas" :key="person.id" :value="person.role">
              {{ person.name }} · {{ roleNames[person.role] }}
            </option>
          </select>
        </label>
        <button class="btn primary wide">Enter demo</button>
      </form>
    </section>
  </main>
</template>
