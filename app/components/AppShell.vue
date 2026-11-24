<script setup lang="ts">
import { roleNames, roleHome } from '#shared/config'
import { employeeLinks, staffNavigation, supportLinks } from '#shared/navigation'

const { role, person, cartCount } = useFms()
const { unread } = useActivity()
const appName = useAppName()
const route = useRoute()
const drawerOpen = ref(false)
const navigation = computed(() =>
  role.value === 'employee' ? employeeLinks : staffNavigation(role.value ?? 'employee'),
)
const home = computed(() => roleHome[role.value ?? 'employee'])
const active = (path: string) =>
  path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(path + '/')
const section = computed(
  () =>
    [...navigation.value, ...supportLinks].find((link) => active(link.to))?.label ??
    { '/workspaces': 'Demo workspaces', '/cart': 'My cart', '/checkout': 'Checkout' }[route.path] ??
    (route.path.startsWith('/orders/') ? 'Order details' : 'Workspace'),
)
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)
useHead({ title: () => section.value + ' · ' + appName })
</script>
<template>
  <div class="shell">
    <a class="skip-link" href="#main-content" @click.prevent="($refs.main as HTMLElement)?.focus()">
      Skip to content
    </a>
    <aside class="sidebar">
      <WorkspaceNavigation :links="navigation" :home="home" />
    </aside>
    <div class="workspace">
      <header class="topbar">
        <div class="bread">
          <USlideover
            v-model:open="drawerOpen"
            side="left"
            title="Workspace navigation"
            :ui="{ content: 'max-w-64 p-4 pt-0 overflow-y-auto', overlay: 'bg-black/40' }"
          >
            <UButton
              class="mobile-only"
              icon="i-lucide-menu"
              color="neutral"
              variant="ghost"
              aria-label="Open navigation"
            />
            <template #content="{ close }">
              <WorkspaceNavigation :links="navigation" :home="home" @navigate="drawerOpen = false">
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  aria-label="Close navigation"
                  @click="close"
                />
              </WorkspaceNavigation>
            </template>
          </USlideover>
          <Glyph name="panel-left" class="desktop-only" />
          <span class="bread-root">Workspace</span>
          <span class="bread-slash">/</span>
          <strong>{{ section }}</strong>
        </div>
        <div class="header-tools">
          <template v-if="role === 'employee'">
            <UButton
              to="/cart"
              variant="ghost"
              color="neutral"
              icon="i-lucide-shopping-cart"
              :aria-label="'Cart, ' + cartCount + ' units'"
            >
              Cart
              <UBadge variant="soft" size="sm">{{ cartCount }}</UBadge>
            </UButton>
            <UChip :show="unread > 0" inset size="sm">
              <UButton
                to="/notifications"
                color="neutral"
                variant="ghost"
                icon="i-lucide-bell"
                aria-label="View notifications"
              />
            </UChip>
          </template>
          <span class="toolbar-divider" />
          <NuxtLink to="/profile" class="user-link" :aria-label="person.name + ', profile'">
            <UAvatar :text="person.initials" color="primary" />
            <span class="user-info">
              <strong>{{ person.name }}</strong>
              <small>{{ roleNames[person.role] }}</small>
            </span>
          </NuxtLink>
        </div>
      </header>
      <main id="main-content" ref="main" class="main" tabindex="-1"><slot /></main>
    </div>
  </div>
</template>
