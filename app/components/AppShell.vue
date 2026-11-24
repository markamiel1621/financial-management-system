<script setup lang="ts">
import { roleNames, roleHome } from '#shared/config'
import { employeeLinks, staffNavigation, supportLinks } from '#shared/navigation'

const { role, person, cartCount, change } = useFms()
const { unread } = useActivity()
const appName = useAppName()
const route = useRoute()
const drawerOpen = ref(false)
const menuButton = ref<HTMLButtonElement>()
const closeButton = ref<HTMLButtonElement>()
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
async function openMenu() {
  drawerOpen.value = true
  await nextTick()
  closeButton.value?.focus()
}
async function closeMenu() {
  drawerOpen.value = false
  await nextTick()
  menuButton.value?.focus()
}
async function signOut() {
  change((state) => {
    state.role = null
  })
  await navigateTo('/login')
}
</script>
<template>
  <div class="shell" @keydown.esc="drawerOpen && closeMenu()">
    <a class="skip-link" href="#main-content" @click.prevent="($refs.main as HTMLElement)?.focus()">
      Skip to content
    </a>
    <button
      v-if="drawerOpen"
      tabindex="-1"
      class="scrim"
      aria-label="Close navigation"
      @click="closeMenu"
    />
    <aside id="workspace-nav" class="sidebar" :class="{ opened: drawerOpen }">
      <div class="brand-row">
        <NuxtLink :to="home" class="brand-link"><BrandMark /></NuxtLink>
        <button
          ref="closeButton"
          class="icon-button mobile-only"
          aria-label="Close navigation"
          @click="closeMenu"
        >
          <Glyph name="x" />
        </button>
      </div>
      <div class="portal-id">
        <span class="portal-icon"><Glyph name="building-2" /></span>
        <div>
          <strong>{{ role === 'employee' ? 'Employee portal' : 'Staff portal' }}</strong>
          <small>Financial Management</small>
        </div>
      </div>
      <nav aria-label="Main navigation">
        <p class="nav-label">Workspace</p>
        <NuxtLink
          v-for="link in navigation"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ selected: active(link.to) }"
          :aria-current="active(link.to) ? 'page' : undefined"
        >
          <Glyph :name="link.icon" />
          {{ link.label }}
          <span v-if="link.to === '/notifications' && unread" class="nav-count">{{ unread }}</span>
        </NuxtLink>
        <p class="nav-label nav-group">Support</p>
        <NuxtLink
          v-for="link in supportLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ selected: active(link.to) }"
        >
          <Glyph :name="link.icon" />
          {{ link.label }}
        </NuxtLink>
      </nav>
      <div class="side-bottom">
        <NuxtLink to="/workspaces" class="switch-link" :class="{ selected: active('/workspaces') }">
          <span class="switch-icon"><Glyph name="layers-3" /></span>
          <span>
            <strong>Demo workspaces</strong>
            <small>Switch role</small>
          </span>
          <Glyph name="chevron-right" />
        </NuxtLink>
        <button class="nav-link signout" @click="signOut">
          <Glyph name="log-out" />
          Sign out
        </button>
      </div>
    </aside>
    <div class="workspace" :inert="drawerOpen">
      <header class="topbar">
        <div class="bread">
          <button
            ref="menuButton"
            class="icon-button mobile-only"
            aria-controls="workspace-nav"
            :aria-expanded="drawerOpen"
            aria-label="Open navigation"
            @click="openMenu"
          >
            <Glyph name="menu" />
          </button>
          <Glyph name="panel-left" class="desktop-only" />
          <span class="bread-root">Workspace</span>
          <span class="bread-slash">/</span>
          <strong>{{ section }}</strong>
        </div>
        <div class="header-tools">
          <template v-if="role === 'employee'">
            <NuxtLink to="/cart" class="cart-link" :aria-label="'Cart, ' + cartCount + ' units'">
              <Glyph name="shopping-cart" />
              <span>Cart</span>
              <b>{{ cartCount }}</b>
            </NuxtLink>
            <NuxtLink to="/notifications" class="icon-button bell" aria-label="View notifications">
              <Glyph name="bell" />
              <i v-if="unread" />
            </NuxtLink>
          </template>
          <span class="toolbar-divider" />
          <NuxtLink to="/profile" class="user-link" :aria-label="person.name + ', profile'">
            <span class="avatar">{{ person.initials }}</span>
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
