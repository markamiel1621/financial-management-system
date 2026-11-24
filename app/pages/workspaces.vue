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
      <button
        v-for="person in personas"
        :key="person.id"
        class="panel role-card"
        :class="{ current: role === person.role }"
        @click="switchRole(person.role)"
      >
        <div class="role-card-top">
          <span class="icon-box" :class="roleDetails[person.role].color">
            <Glyph :name="roleDetails[person.role].icon" />
          </span>
          <span v-if="role === person.role" class="meta-chip">Current</span>
        </div>
        <h2>{{ roleNames[person.role] }}</h2>
        <strong>{{ person.name }}</strong>
        <p>{{ roleDetails[person.role].description }}</p>
      </button>
    </div>
    <section class="panel reset-card">
      <div>
        <h2>Reset the presentation</h2>
        <p class="muted">
          Restore the original sample orders, catalog, and empty cart in this browser.
        </p>
      </div>
      <button v-if="!confirmReset" class="btn secondary" @click="confirmReset = true">
        <Glyph name="rotate-ccw" />
        Reset demo
      </button>
      <div v-else class="form-actions">
        <button class="btn danger" @click="reset">Confirm reset</button>
        <button class="btn secondary" @click="confirmReset = false">Keep changes</button>
      </div>
    </section>
  </div>
</template>
