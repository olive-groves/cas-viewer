<script lang="ts">
  import type {
    GeoJSONStoreFeatures,
    GeoJSONStoreGeometries,
  } from 'terra-draw';
  import AutogrowTextArea from './AutogrowTextArea.svelte';

  let {
    mode = "selected",
    properties = $bindable(),
    geometry,
    onEditClick,
    onSelectedCloseClick,
    onDoneClick,
    onDrawAnotherClick,
    onEditingCloseClick,
  }: {
    mode: "selected" | "editing";
    properties?: GeoJSONStoreFeatures<GeoJSONStoreGeometries>["properties"];
    geometry?: GeoJSONStoreFeatures<GeoJSONStoreGeometries>["geometry"];
    onEditClick?: () => void;
    onSelectedCloseClick?: () => void;
    onDoneClick?: () => void;
    onDrawAnotherClick?: () => void;
    onEditingCloseClick?: () => void;
  } = $props();
</script>

<div class="panel">
  {#if mode === "selected"}
    <div class="titlebar">
      <div>
        {properties?.title || `Untitled ${geometry?.type}`}
      </div>
      <div style:margin-inline-start=auto>
        <button>
          Fit to view
        </button>
        <button onclick={() => onSelectedCloseClick?.()}>
          ×
        </button>
      </div>
    </div>
    <div class="actionbar">
      <button onclick={() => onEditClick?.()}>
        Edit
      </button>
    </div>
  {:else if mode === "editing"}
    <div class="titlebar">
      <input type="text"
        placeholder={`Untitled ${geometry?.type}`}
        bind:value={properties.title}
      />
      <div style:margin-inline-start=auto>
        <button onclick={() => onEditingCloseClick?.()}>
          ×
        </button>
      </div>
    </div>
    <div class="content">
      <label>
        <select bind:value={properties.category}>
          <option value="">Select a category</option>
          {#each ["crack", "loss"] as category}
            <option value={category.toLowerCase()}>
              {category}
            </option>
          {/each}
        </select>
      </label>
    </div>
    <div class="actionbar">
      <button onclick={() => onDoneClick?.()}>
        Done
      </button>
      <button onclick={() => onDrawAnotherClick?.()}>
        Draw Another
      </button>
    </div>
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    background: color-mix(in srgb, Canvas, CanvasText 10%);
    padding: var(--gap);
    min-width: 300px;
    border: 1px solid color-mix(in srgb, CanvasText, Canvas 50%);
    border-radius: var(--gap);

    button {
      padding: 0 calc(2 * var(--gap));
    }

    .titlebar {
      display: flex;
    }
    .actionbar {
      display: flex;
      padding-top: var(--gap);
      gap: var(--gap);
    }
    .content {

    }
  }
</style>
