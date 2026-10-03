<!-- Given an array of GeoJSON features per Annotation schema, generate an overview list -->
<script lang="ts">
  import type {
    GeoJSONStoreFeatures,
    GeoJSONStoreGeometries,
  } from 'terra-draw';
  import { TAG_CHROMA_HUE, TAG_MAP } from './feature-utils.svelte';

  type FeatureId = string | number;

  let {
    features = [],
    selectedFeature,
    onFeatureHoverStart,  // A feature was hovered in the list
    onFeatureHoverEnd,  // A feature was no longer hovered in the list
    onFeatureClick,  // A feature was clicked in the list
    onFeatureDoubleClick,  // A feature was double-clicked in the list
    onFeatureEdit,  // A feature's "edit me" button was clicked in the list
  }: {
    features: GeoJSONStoreFeatures<GeoJSONStoreGeometries>[];
    selectedFeature?: FeatureId | null;
    onFeatureHoverStart?: (featureId: FeatureId) => void;
    onFeatureHoverEnd?: (featureId: FeatureId) => void;
    onFeatureClick?: (featureId: FeatureId) => void;
    onFeatureDoubleClick?: (featureId: FeatureId) => void;
    onFeatureEdit?: (featureId: FeatureId) => void;
  } = $props();
</script>

<div class="features unselectable">

  {#each features as feature (feature.id)}
    {@const featureId = feature.id ?? "undefined-feature-id"}
    <!-- FIXME: Accessibility -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class={["feature", {selected: featureId === selectedFeature}]}
      // TODO: Is this a sure-fire ID'ing approach for these list items?
      // If features without ids > 1, then we have duplicate id's.
      id={`feature-${featureId}`}
      role="application"
      onpointerenter={() => onFeatureHoverStart?.(featureId)}
      onpointerleave={() => onFeatureHoverEnd?.(featureId)}
      onclick={() => onFeatureClick?.(featureId)}
      ondblclick={() => onFeatureDoubleClick?.(featureId)}
    >
      <div class="symbol">
        <span class={["material-symbols-sharp"]}>
          {feature.geometry.type === "LineString" ? "timeline" : feature.geometry.type === "Polygon" ? "pentagon" : feature.geometry.type === "Point" ? "south_west" : ""}
        </span>
      </div>
      <div class="titlebar">
        <div class="category">
          <span class={{unfilled: !feature.properties.category}}>
            {feature.properties.category || "uncategorized"}
          </span>
        </div>
        {#if feature.properties.title}
          <div class="title">
            <span class={{unfilled: !feature.properties.title}}>
              {feature.properties.title}
            </span>
          </div>
        {/if}
        <div class="edit">
          <button onclick={(e) => {onFeatureEdit?.(featureId); e.stopPropagation();} }>
            Edit
          </button>
        </div>
      </div>
      {#if feature.properties?.tags?.length}
        <div class="details">
          <div class="tags">
            {#each feature.properties?.tags as tag (tag)}
              <div title={TAG_MAP.get(tag)?.description} class="tag" style:--chroma={TAG_CHROMA_HUE.get(tag)?.chroma} style:--hue={TAG_CHROMA_HUE.get(tag)?.hue}>
                {tag}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/each}

</div>

<style>
  .features {
    display: flex;
    flex-direction: column;
    overflow: auto;
    background-color: color-mix(in srgb, Canvas, transparent 5%);
    > * {
      border: 1px solid transparent;
      border-top-color: color-mix(in oklab, currentColor, transparent 75%);
      &:last-child {
        border-bottom-color: color-mix(in oklab, currentColor, transparent 75%);
      }
      &:hover {
        border: 1px solid color-mix(in oklab, currentColor, transparent 50%);
      }
      &.selected {
        border: 1px solid;
      }
    }

    .feature {
      display: grid;
      grid-template-rows: 1fr 0fr;
      grid-template-columns: 0fr 1fr;
      gap: calc(0.5 * var(--gap));
      padding: var(--gap);
      padding-left: calc(var(--gap) / 2);
      .symbol {
        color: color-mix(in oklab, currentColor, transparent 25%);
        grid-column: 1;
        grid-row: 1;
        padding-inline-end: calc(var(--gap) / 2);
        line-height: 1em;
      }
      .titlebar {
        grid-column: 2;
        grid-row: 1;
        display: flex;
        align-items: first baseline;
        gap: calc(2 * var(--gap));
        min-width: 0;
        margin-bottom: calc(-1 * var(--gap));
        .category {
          font-weight: 500;
          font-size: 1.2rem;
          line-height: 1em;
        }
        .title {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: color-mix(in srgb, CanvasText, Canvas 25%);
        }
        .edit {
          align-self: start;
        }
      }
      .details {
        grid-column: 2;
        grid-row: 2;
        display: flex;
        min-width: 0;
        gap: calc(2 * var(--gap));
        .tags {
          overflow: auto;
          display: flex;
          gap: var(--gap);
          .tag {
            white-space: nowrap;
            --color: oklch(from CanvasText var(--lightness, 0.7) var(--chroma, 0.2) var(--hue, h));
            font-size: 0.9rem;
            border: 1px solid var(--color);
            border-radius: var(--gap);
            color: color-mix(in oklab, var(--color), CanvasText 80%);
            background: color-mix(in oklab, var(--color), Canvas 85%);
            padding-inline: var(--gap);
          }
        }
      }
      .edit {
        font-size: 0.85rem;
        color: color-mix(in oklab, currentColor, transparent 20%);
        margin-inline-start: auto;
        button {
          padding: 0 var(--gap);
        }
      }
    }
  }
  .category::first-letter {
    text-transform: capitalize;
  }
  .unfilled {
    color: color-mix(in srgb, CanvasText, Canvas 50%);
  }
</style>
