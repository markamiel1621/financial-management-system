<script setup lang="ts">
import { roleNames } from '#shared/config'
const { person } = useFms()
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Account</p>
        <h1>Profile</h1>
      </div>
    </div>
    <section class="panel profile-panel">
      <UAvatar :text="person.initials" size="3xl" color="primary" />
      <div>
        <h2>{{ person.name }}</h2>
        <p class="muted">{{ person.position }} · {{ person.office }}</p>
      </div>
    </section>
    <UCard as="section">
      <h2>Workspace details</h2>
      <dl class="info-list">
        <div>
          <dt>Account ID</dt>
          <dd>{{ person.id }}</dd>
        </div>
        <div>
          <dt>Office</dt>
          <dd>{{ person.office }}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{{ roleNames[person.role] }}</dd>
        </div>
      </dl>
      <UButton color="neutral" variant="outline" to="/workspaces" icon="i-lucide-layers-3">
        Switch demo workspace
      </UButton>
    </UCard>
  </div>
</template>
