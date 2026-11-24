<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { supportLinks } from '#shared/navigation'

type WorkspaceLink = (typeof supportLinks)[number]
const props = defineProps<{ links: WorkspaceLink[]; home: string }>()
const emit = defineEmits<{ navigate: [] }>()
const { role, change } = useFms()
const { unread } = useActivity()
const route = useRoute()

function menuItem(link: WorkspaceLink): NavigationMenuItem {
  return {
    ...link,
    icon: 'i-lucide-' + link.icon,
    active: route.path === link.to || route.path.startsWith(link.to + '/'),
    badge: link.to === '/notifications' && unread.value ? unread.value : undefined,
    onSelect: () => emit('navigate'),
  }
}
const groups = computed<NavigationMenuItem[][]>(() => [
  [{ type: 'label', label: 'Workspace' }, ...props.links.map(menuItem)],
  [{ type: 'label', label: 'Support' }, ...supportLinks.map(menuItem)],
])
async function signOut() {
  change((state) => {
    state.role = null
  })
  emit('navigate')
  await navigateTo('/login')
}
</script>
<template>
  <div class="brand-row">
    <NuxtLink :to="home" class="brand-link" @click="emit('navigate')"><BrandMark /></NuxtLink>
    <slot />
  </div>
  <div class="portal-id">
    <span class="portal-icon"><Glyph name="building-2" /></span>
    <div>
      <strong>{{ role === 'employee' ? 'Employee portal' : 'Staff portal' }}</strong>
      <small>Financial Management</small>
    </div>
  </div>
  <UNavigationMenu
    :items="groups"
    orientation="vertical"
    aria-label="Main navigation"
    :ui="{ link: 'min-h-10 px-3', label: 'text-xs uppercase tracking-wider' }"
  />
  <div class="side-bottom">
    <NuxtLink
      to="/workspaces"
      class="switch-link"
      :class="{ selected: route.path === '/workspaces' }"
      @click="emit('navigate')"
    >
      <span class="switch-icon"><Glyph name="layers-3" /></span>
      <span>
        <strong>Demo workspaces</strong>
        <small>Switch role</small>
      </span>
      <Glyph name="chevron-right" />
    </NuxtLink>
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-log-out"
      class="mt-2 w-full justify-start"
      @click="signOut"
    >
      Sign out
    </UButton>
  </div>
</template>
