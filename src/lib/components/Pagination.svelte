<!--
  Pagination.svelte
  Reusable dot-pagination bar. Used by Showcase (always) and About (mobile).

  Props:
    count      — total page count
    current    — active page index (0-based)
    dotColor   — colour of active dot (default #171717)
    trackColor — colour of inactive dots (default rgba(0,0,0,0.22))

  Events:
    on:change  — { detail: pageIndex } when user clicks a dot
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let count:      number = 0
  export let current:    number = 0
  export let dotColor:   string = '#171717'
  export let trackColor: string = 'rgba(0,0,0,0.22)'

  const dispatch = createEventDispatcher<{ change: number }>()
</script>


<!-- STRUCTURE -->
{#if count > 1}
  <nav class="pagination" aria-label="Сторінки">
    {#each { length: count } as _, i}
      <button
        class="dot"
        class:dot--active={i === current}
        style="--dot:{dotColor}; --track:{trackColor};"
        on:click={() => dispatch('change', i)}
        aria-label="Сторінка {i + 1}"
        aria-current={i === current ? 'page' : undefined}
      ></button>
    {/each}
  </nav>
{/if}

<style>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    padding: 0.45rem 0.9rem;
    background: rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(8px);
    border-radius: 100px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    justify-self: center;
    z-index: 20;
  }

  .dot {
    appearance: none;
    border: none;
    padding: 0;
    background: var(--track);
    border-radius: 50%;
    width: 7px;
    height: 7px;
    cursor: pointer;
    transition:
      background 0.25s ease,
      transform  0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      width      0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .dot:hover { background: rgba(0, 0, 0, 0.5); transform: scale(1.3); }

  .dot--active {
    background: var(--dot);
    width: 22px;
    border-radius: 100px;
    transform: none;
  }

  @media (max-width: 800px) {
    .pagination { gap: 0.4rem; padding: 0.35rem 0.7rem; }
    .dot        { width: 6px; height: 6px; }
    .dot--active{ width: 18px; }
  }
</style>