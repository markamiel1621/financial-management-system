<script setup lang="ts">
import { money } from '#shared/orders'
const { model } = useFms()
const search = ref('')
const category = ref<string | null>(null)
const type = ref<string | null>(null)
const availability = ref<string | null>(null)
const published = computed(() => model.value.catalog.filter((item) => item.active))
const categories = computed(() => [
  { label: 'All categories', value: null },
  ...[...new Set(published.value.map((item) => item.category))].map((value) => ({
    label: value,
    value,
  })),
])
const types = [
  { label: 'All types', value: null },
  { label: 'Product', value: 'Product' },
  { label: 'Service', value: 'Service' },
]
const availabilityOptions = [
  { label: 'All availability', value: null },
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
]
const items = computed(() =>
  published.value.filter(
    (item) =>
      (item.title + ' ' + item.description + ' ' + item.sku)
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()) &&
      (!category.value || item.category === category.value) &&
      (!type.value || item.type === type.value) &&
      (!availability.value ||
        (item.stock !== 0 && item.eligible) === (availability.value === 'available')),
  ),
)
function clear() {
  search.value = ''
  category.value = null
  type.value = null
  availability.value = null
}
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Employee workspace</p>
        <h1>Catalog</h1>
        <p class="lede">Browse workplace products and services available to your office.</p>
      </div>
    </div>
    <div class="filter-bar panel">
      <UInput
        v-model="search"
        type="search"
        icon="i-lucide-search"
        class="search-field"
        aria-label="Search catalog"
        placeholder="Search the catalog"
      />
      <USelect v-model="category" :items="categories" aria-label="Category" />
      <USelect v-model="type" :items="types" aria-label="Item type" />
      <USelect v-model="availability" :items="availabilityOptions" aria-label="Availability" />
    </div>
    <div class="list-caption" aria-live="polite">
      {{ items.length }} {{ items.length === 1 ? 'offering' : 'offerings' }}
      <UButton v-if="search || category || type || availability" variant="link" @click="clear">
        Clear filters
      </UButton>
    </div>
    <div v-if="items.length" class="catalog-grid">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="'/catalog/' + item.id"
        class="panel catalog-card"
      >
        <CatalogArt :item="item" />
        <div class="catalog-card-body">
          <div class="catalog-meta">
            <span>{{ item.category }}</span>
            <UBadge color="neutral" variant="soft" size="sm" class="w-fit">{{ item.type }}</UBadge>
          </div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
          <div class="catalog-card-foot">
            <span class="price">
              {{ item.funding === 'free' ? 'No employee charge' : money(item.price) }}
              <small v-if="item.price">/ {{ item.unit }}</small>
            </span>
            <span :class="['availability', { unavailable: item.stock === 0 || !item.eligible }]">
              {{ item.stock === 0 ? 'Unavailable' : !item.eligible ? 'Restricted' : 'Available' }}
            </span>
          </div>
          <span class="card-detail">
            View details
            <Glyph name="chevron-right" />
          </span>
        </div>
      </NuxtLink>
    </div>
    <div v-else class="panel">
      <EmptyState
        title="No matching offerings"
        text="Try another keyword or clear the filters."
        icon="search"
      >
        <UButton color="neutral" variant="outline" @click="clear">Clear filters</UButton>
      </EmptyState>
    </div>
  </div>
</template>
