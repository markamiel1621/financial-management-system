<script setup lang="ts">
import { money } from '#shared/orders'
const { model } = useFms()
const search = ref('')
const category = ref('')
const type = ref('')
const availability = ref('')
const published = computed(() => model.value.catalog.filter((item) => item.active))
const categories = computed(() => [...new Set(published.value.map((item) => item.category))])
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
  category.value = ''
  type.value = ''
  availability.value = ''
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
      <label class="search-field">
        <Glyph name="search" />
        <input
          v-model="search"
          type="search"
          aria-label="Search catalog"
          placeholder="Search the catalog"
        />
      </label>
      <label class="select-wrap">
        <select v-model="category" aria-label="Category">
          <option value="">All categories</option>
          <option v-for="name in categories" :key="name">{{ name }}</option>
        </select>
        <Glyph name="chevron-down" />
      </label>
      <label class="select-wrap">
        <select v-model="type" aria-label="Item type">
          <option value="">All types</option>
          <option>Product</option>
          <option>Service</option>
        </select>
        <Glyph name="chevron-down" />
      </label>
      <label class="select-wrap">
        <select v-model="availability" aria-label="Availability">
          <option value="">All availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <Glyph name="chevron-down" />
      </label>
    </div>
    <div class="list-caption" aria-live="polite">
      {{ items.length }} {{ items.length === 1 ? 'offering' : 'offerings' }}
      <button v-if="search || category || type || availability" class="text-link" @click="clear">
        Clear filters
      </button>
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
            <span class="type-tag">{{ item.type }}</span>
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
        <button class="btn secondary" @click="clear">Clear filters</button>
      </EmptyState>
    </div>
  </div>
</template>
