<script setup lang="ts">
import { fundingLabels } from '#shared/config'
import { money } from '#shared/orders'
import type { Offering } from '#shared/types'

const { model } = useFms()
// undefined shows the list, null opens a blank item.
const editing = ref<Offering | null>()
</script>

<template>
  <section class="panel">
    <CatalogItemForm v-if="editing !== undefined" :item="editing" @close="editing = undefined" />
    <template v-else>
      <div class="panel-head">
        <h2>
          Catalog offerings <small>({{ model.catalog.length }})</small>
        </h2>
        <UButton icon="i-lucide-plus" @click="editing = null">New catalog item</UButton>
      </div>
      <article v-for="item in model.catalog" :key="item.id" class="edit-row">
        <div class="editor-heading">
          <span class="icon-box" :class="item.color"><Glyph :name="item.icon" /></span>
          <div>
            <h3>{{ item.title }}</h3>
            <small>
              {{ item.sku }} · {{ fundingLabels[item.funding] }} · {{ money(item.price) }} /
              {{ item.unit }} ·
              {{ item.stock === null ? 'Unlimited capacity' : item.stock + ' available' }} ·
              {{ item.active ? 'Published' : 'Unpublished' }}
            </small>
          </div>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            :aria-label="'Edit ' + item.title"
            @click="editing = item"
          >
            Edit
          </UButton>
        </div>
      </article>
    </template>
  </section>
</template>
