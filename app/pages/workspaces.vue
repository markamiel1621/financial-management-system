<script setup lang="ts">
import { personas, roleNames } from '#shared/config'
import { roleDetails } from '#shared/roles'
const { role, switchRole, reset } = useFms()
const confirmReset = ref(false)
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Presentation controls</p>
        <h1>Demo workspaces</h1>
        <p class="lede">Choose a sample identity to follow the same order through each role.</p>
      </div>
    </div>
    <div class="role-grid">
      <UButton
        v-for="person in personas"
        color="neutral"
        variant="outline"
        :aria-pressed="role === person.role"
        :key="person.id"
        class="panel role-card"
        :class="{ current: role === person.role }"
        @click="switchRole(person.role)"
      >
        <div class="role-card-top">
          <span class="icon-box" :class="roleDetails[person.role].color">
            <Glyph :name="roleDetails[person.role].icon" />
          </span>
          <UBadge v-if="role === person.role" variant="soft">Current</UBadge>
        </div>
        <h2>{{ roleNames[person.role] }}</h2>
        <strong>{{ person.name }}</strong>
        <p>{{ roleDetails[person.role].description }}</p>
      </UButton>
    </div>
    <section class="panel reset-card">
      <div>
        <h2>Reset the presentation</h2>
        <p class="muted">
          Restore the original sample orders, catalog, and empty cart in this browser.
        </p>
      </div>
      <UButton
        v-if="!confirmReset"
        color="neutral"
        variant="outline"
        @click="confirmReset = true"
        icon="i-lucide-rotate-ccw"
      >
        Reset demo
      </UButton>
      <div v-else class="form-actions">
        <UButton color="error" variant="soft" @click="reset">Confirm reset</UButton>
        <UButton color="neutral" variant="outline" @click="confirmReset = false">
          Keep changes
        </UButton>
      </div>
    </section>
  </div>
</template>
