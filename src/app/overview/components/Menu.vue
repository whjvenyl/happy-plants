<template>
  <div :class="wrapperClass">
    <ul class="menu-left">
      <li v-if="showViewmode">
        <button
          aria-label="View mode"
          :class="`view-mode icon ${disableMenu ? '' : 'inverse'}`"
          @click.prevent="emitMenuAction('view-mode')">
          <feather-grid width="18" height="18" />
        </button>
      </li>
      <li v-if="showCategories">
        <button
          aria-label="Categorise"
          class="categorise icon inverse"
          @click.prevent="emitMenuAction('category')">
          <feather-layers width="18" height="18" />
        </button>
      </li>
    </ul>

    <router-link
      tag="button"
      aria-label="Add plant"
      class="add-plant icon"
      :to="{ path: 'add' }"
      :event="disableMenu ? '' : 'click'">
      <svgicon icon="leaf"
        width="20"
        height="28"
        color="#000" />
    </router-link>

    <ul class="menu-right">
      <li v-if="showDelete">
        <button
          aria-label="Trash"
          class="delete icon inverse"
          @click.prevent="emitMenuAction('delete')">
          <feather-trash width="18" height="18" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
  import '@/assets/leaf'

  export default {
    name: 'OverviewMenu',

    components: {
      'feather-trash': () =>
          import('vue-feather-icon/components/trash-2' /* webpackChunkName: "overview" */),
      'feather-grid': () =>
          import('vue-feather-icon/components/grid' /* webpackChunkName: "overview" */),
      'feather-layers': () =>
          import('vue-feather-icon/components/layers' /* webpackChunkName: "overview" */)
    },

    props: {
      noElements: { type: Boolean, default: false },
      showDelete: { type: Boolean, default: true },
      showViewmode: { type: Boolean, default: true },
      showCategories: { type: Boolean, default: false },
      disableMenu: { type: Boolean, default: false }
    },

    computed: {
      wrapperClass () {
        return {
          'overview-menu': true,
          'single': this.noElements,
          'disabled': this.disableMenu
        }
      }
    },

    methods: {
      emitMenuAction (type) {
        if (this.disableMenu) return
        this.$emit('clicked-item', type)
      }
    }
  }
</script>

<style lang="postcss" scoped>
  @import "../../../styles/media-queries";

  .overview-menu {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    height: var(--app-footer-size);
    background: var(--background-primary);
    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.1);

    @media (--min-desktop-viewport) {
      width: var(--app-desktop-max-width);
      margin: 0 auto;
    }

    & ul {
      list-style: none;
    }

    & li,
    & li button {
      width: var(--app-footer-size);
      height: var(--app-footer-size);
    }

    & ul li button {
      display: flex;
      justify-content: center;

      & svg {
        margin-right: 0;
      }

      &:active::after,
      &:focus::after {
        opacity: 0;
      }
    }
  }

  .menu-left,
  .menu-right {
    height: 100%;
    flex: 1;
    display: flex;
    align-items: center;

    @nest .single & {
      display: none;
    }

    @nest .disabled & li button:not(.view-mode) {
      opacity: 0.3;
    }

    @nest .disabled & li .view-mode {
      background: var(--brand-green);
    }
  }

  .menu-left {
    justify-content: flex-start;

    & li:first-child button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }

  .menu-right {
    justify-content: flex-end;

    & li:last-child button {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  .add-plant {
    box-shadow: none;
    height: var(--app-footer-size);
    width: var(--app-footer-size);
    padding: 0;
    justify-content: center;

    & svg {
      margin: 0;
      filter: invert(1);
    }

    @nest .disabled & {
      opacity: 0.3;
    }
  }
</style>
