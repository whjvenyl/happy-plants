<template>
  <main class="main-wireframe">
    <app-header :settings="true">
      <h1 slot="title" @click="scrollTop">
        Happy Plants
      </h1>
    </app-header>

    <!-- Alert window pops up as confirmation the user is about to delete plants. -->
    <overview-alert
      type="warning"
      class="overview-alert"
      :show="showAlert"
      @close-alert="cancelDeleteMode">
      <h1 slot="headline">Are you sure?</h1>
      <p slot="content">
        You are about to delete <strong>{{ selection.length }}</strong> plants.
      </p>
      <button class="default" slot="cancel" @click="cancelDeleteMode">
        Cancel
      </button>
      <button class="warning" slot="confirm" @click="confirmDeletePlants">
        Yes, delete plants
      </button>
    </overview-alert>

    <!-- Backdrop shows when user starts category selection. -->
    <div v-if="showCategoryBackdrop" class="category-selection-backdrop">
      <p>Select category</p>
      <feather-arrow-down />
    </div>

    <section :class="{ 'no-plants': plants.length <= 0 }">
      <!-- Simple onboarding instruction if user has no plants yet. -->
      <plants-intro
        v-if="plants.length <= 0"
        key="overview-intro" />

      <div v-if="plants.length" :class="{ 'plant-options': true, 'big-gap': listByCategory}">
        <overview-filter
          class="plant-filter"
          :selected="filter"
          @update-selection="sortItems" />
      </div>

      <!-- List of plants used when filter is either "alphabetical" or "latest". -->
      <plants-list
        v-if="plants.length && (!listByCategory || isCategoryMode)"
        @delete-selection="toggleDeleteSelection"
        @categorise-selection="toggleCategorySelection"
        :plants="plants"
        :selectedCategory="selectedCategory"
        :isDeleteMode="isDeleteMode"
        :isCategoryMode="isCategoryMode" />

      <!-- List of plants if filter is set to "category". -->
      <div v-else-if="plants.length && (listByCategory || !isCategoryMode)" class="plant-list-category">
        <div v-for="(category, index) in sortedCategoryList" v-if="category.plants.length">
          <h2 @click="toggleCollapseCategory(index)">
            {{ category.label }}
            <feather-maximize v-if="isCollapsed(index)" width="18" height="18" />
            <feather-minimize v-else width="18" height="18" />
          </h2>

          <div v-show="isCollapsed(index)" class="list-collapsed-indicator"></div>

          <plants-list
            v-show="!isCollapsed(index)"
            @delete-selection="toggleDeleteSelection"
            @categorise-selection="toggleCategorySelection"
            :plants="category.plants"
            :selectedCategory="selectedCategory"
            :isDeleteMode="isDeleteMode"
            :isCategoryMode="isCategoryMode" />
        </div>
      </div>

      <footer :class="footerClass">
        <!-- Delete button and control element. -->
        <selection-delete
          v-if="plants.length && !isCategoryMode"
          :activeSelection="isDeleteMode"
          :selected="this.selection.length"
          @cancel-selection="cancelDeleteMode"
          @delete-selection="activateDeleteMode" />

        <!-- Button to add new plants. -->
        <router-link
          v-if="!editMode"
          tag="button"
          aria-label="Add plant"
          class="add-plant circle"
          :to="{ path: 'add' }">
          <svgicon icon="leaf" width="16" height="24" color="#000"></svgicon>
        </router-link>

        <!-- Categorisation button and control element. -->
        <selection-categorise
          v-if="plants.length && !isDeleteMode"
          :activeSelection="isCategoryMode"
          :categories="categories"
          @category-selected="updateCategorySelection"
          @cancel-selection="cancelCategoriseMode"
          @categorise-selection="activateCategoriseMode"
          @save-selection="saveCategories" />
      </footer>
    </section>
  </main>
</template>

<script>
  import { mapState, mapActions } from 'vuex'
  import AppHeader from '@/components/AppHeader'
  import OverviewAlert from '@/components/Alert'
  import SelectionDelete from './components/SelectionDelete'
  import SelectionCategorise from './components/SelectionCategorise'
  import PlantsList from './components/PlantsList'
  import PlantsIntro from './components/PlantsIntro'
  import OverviewFilter from './components/OverviewFilter'
  import '@/assets/leaf'

  export default {
    name: 'Overview',

    components: {
      'app-header': AppHeader,
      'overview-alert': OverviewAlert,
      'selection-delete': SelectionDelete,
      'selection-categorise': SelectionCategorise,
      'plants-intro': PlantsIntro,
      'plants-list': PlantsList,
      'overview-filter': OverviewFilter,
      'feather-arrow-down': () =>
        import('vue-feather-icon/components/arrow-down' /* webpackChunkName: "overview" */),
      'feather-minimize': () =>
        import('vue-feather-icon/components/minimize-2' /* webpackChunkName: "overview" */),
      'feather-maximize': () =>
        import('vue-feather-icon/components/maximize-2' /* webpackChunkName: "overview" */)
    },

    computed: {
      ...mapState({
        plants: state => state.plants,
        filter: state => state.settings.filter,
        categories: state => state.categories
      }),
      isCategoryMode () {
        return this.editMode === 'category'
      },
      isDeleteMode () {
        return this.editMode === 'delete'
      },
      footerClass () {
        if (!this.editMode) return ''
        return `editmode mode-${this.editMode}`
      },
      listByCategory () {
        return this.filter === 'categories'
      },
      sortedCategoryList () {
        if (this.selectedCategory) {
          return this.categories
        }

        const list = this.categories.map(cat => ({
          guid: cat.guid,
          label: cat.label,
          plants: this.plants.filter(plant =>
            plant.categories && plant.categories.includes(cat.guid))
        }))

        list.push({
          label: 'Uncategorised',
          plants: this.plants.filter(plant =>
            plant.categories && !plant.categories.length)
        })

        return list
      }
    },

    watch: {
      showCategoryBackdrop (show) {
        if (show) {
          this.$root.$el.parentNode.classList.add('js-no-scrolling')
        } else {
          this.$root.$el.parentNode.classList.remove('js-no-scrolling')
        }
      }
    },

    data () {
      return {
        selection: [],
        selectedCategory: false,
        editMode: false,
        showAlert: false,
        showCategoryBackdrop: false,
        collapsedCategories: []
      }
    },

    methods: {
      ...mapActions([
        'loadPlants',
        'updatePlantCategory',
        'deletePlants',
        'showNotification',
        'updateFilter'
      ]),
      reset () {
        Object.assign(this.$data, this.$options.data()) // Reset state
      },
      scrollTop () {
        const duration = 222
        const cosParameter = window.scrollY / 2
        let count = 0
        let oldTimestamp = performance.now()

        function step (newTimestamp) {
          count += Math.PI / (duration / (newTimestamp - oldTimestamp))

          if (count >= Math.PI) window.scrollTo(0, 0)
          if (window.scrollY === 0) return

          window.scrollTo(0, Math.round(cosParameter + cosParameter * Math.cos(count)))
          oldTimestamp = newTimestamp
          window.requestAnimationFrame(step)
        }

        window.requestAnimationFrame(step)
      },
      toggleDeleteSelection (item) {
        if (item.selected) {
          this.selection.push(item)
        } else {
          this.selection = this.selection.filter(s => s.guid !== item.guid)
        }
      },
      toggleCategorySelection (item) {
        this.selection.push(item)
      },
      activateDeleteMode () {
        // If the delete mode is already active, the selected elements should
        // be deleted and the mode deactivated again.
        if (this.isDeleteMode && this.selection.length) {
          this.showAlert = true
        }

        this.editMode = 'delete'
      },
      cancelDeleteMode () {
        this.reset()
      },
      confirmDeletePlants () {
        const message = this.selection.length > 1
          ? `Deleted ${this.selection.length} plants.`
          : `Deleted ${this.selection.length} plant.`

        this.showNotification({ message })
        this.deletePlants(this.selection)
        this.cancelDeleteMode()
      },
      updateCategorySelection (category) {
        this.showCategoryBackdrop = false
        this.selectedCategory = category
      },
      activateCategoriseMode () {
        this.editMode = 'category'
        this.showCategoryBackdrop = true

        if (!this.categoriseMode) {
          this.selection = []
        }
      },
      cancelCategoriseMode () {
        this.reset()
      },
      saveCategories () {
        this.selection.forEach(selection =>
          this.updatePlantCategory({
            guid: selection.guid,
            category: this.selectedCategory,
            type: selection.type
          }))

        this.showNotification({
          message: `Category "${this.selectedCategory.label}" updated.`
        })

        this.cancelCategoriseMode()
      },
      sortItems (type) {
        this.updateFilter({ filter: type })
      },
      toggleCollapseCategory (index) {
        if (this.collapsedCategories.includes(index)) {
          this.collapsedCategories.splice(this.collapsedCategories.indexOf(index), 1)
        } else {
          this.collapsedCategories.push(index)
        }
      },
      isCollapsed (index) {
        return this.collapsedCategories.includes(index)
      }
    }
  }
</script>

<style lang="scss" scoped>
  @import "~styles/animations";
  @import "~styles/z-index";

  $content-index: list, backdrop, footer;
  $footer-btn-size: 60px;

  main {
    min-height: 100vh;
    background: var(--background-secondary);
  }

  main > section {
    height: 100%;
    padding: var(--base-gap);
    padding-bottom: calc(#{$footer-btn-size} + var(--base-gap) * 2);

    &.no-plants {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - var(--app-header-size));
    }
  }

  .overview-alert {
    button.warning {
      background: var(--brand-yellow);
      color: var(--link-color);
      box-shadow: var(--plain-shadow);
    }
  }

  .header-controls {
    display: flex;

    button {
      margin-right: var(--base-gap);
    }

    .active svg {
      fill: black;
    }
  }

  .category-selection-backdrop {
    width: 100%;
    height: 100vh;
    position: fixed;
    background: var(--transparency-black-medium);
    z-index: z($content-index, backdrop);
    display: flex;
    justify-content: center;
    color: var(--text-color-inverse);
    align-items: center;
    flex-direction: column;

    p {
      margin-bottom: var(--base-gap);
      font-weight: 600;
    }

    svg,
    svg rect,
    svg path {
      stroke: var(--text-color-button);
    }
  }

  .plant-options {
    margin-bottom: var(--base-gap);

    &.big-gap {
      margin-bottom: calc(var(--base-gap) * 1.5);
    }
  }

  .plant-list {
    z-index: z($content-index, list);
  }

  .plant-list-category {
    h2 {
      display: flex;
      align-items: center;
      margin-bottom: calc(var(--base-gap) * 1.5);
    }

    h2 svg {
      stroke: var(--dark-grey);
      margin-left: calc(var(--base-gap) / 2);
    }

    .plant-list {
      justify-content: flex-start;
      margin-bottom: calc(var(--base-gap) * 0.5);
    }

    .list-collapsed-indicator {
      width: 100%;
      height: 10px;
      display: flex;
      justify-content: space-between;
      transform: translateY(-50%);
      margin-bottom: var(--base-gap);
      --list-gap: calc(var(--base-gap) * 2 - var(--base-gap) / 2);

      &::after,
      &::before {
        content: "";
        border-radius: var(--border-radius);
        border: 2px dashed var(--grey);
        width: calc(50vw - var(--list-gap));
      }
    }
  }

  section footer {
    position: fixed;
    bottom: var(--base-gap);
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: z($content-index, footer);
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: calc(100% - var(--base-gap) * 2);

    @supports (justify-content: space-evenly) {
      justify-content: space-evenly;
    }

    .add-plant {
      width: $footer-btn-size;
      height: $footer-btn-size;
    }

    /* TODO: Remove when desktop layout is actually in development. */
    @media (min-width: var(--app-media-max-size)) {
      width: var(--app-media-max-size);
    }
  }
</style>