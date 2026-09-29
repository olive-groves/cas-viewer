<!-- Given an array of GeoJSON features per Annotation schema, generate an overview list -->
<script lang="ts">
  import type {
    GeoJSONStoreFeatures,
    GeoJSONStoreGeometries,
  } from 'terra-draw';

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
      <div class="title">
        {feature.properties.title || `Untitled ${feature.geometry.type ?? ""}`}
      </div>
      <div class="category">
        {feature.properties.category || "Uncategorized"}
      </div>
      <div class="tags">
        {#each feature.properties?.tags as tag (tag)}
        {tag}
        {/each}
      </div>
      <div class="edit" style:margin-inline-start=auto>
        <button onclick={() => onFeatureEdit?.(featureId)}>
          Edit
        </button>
      </div>
    </div>
  {/each}

</div>

<style>
  .features {
    display: flex;
    flex-direction: column;
    overflow: auto;

    gap: 0.5em;
    background-color: rgba(0, 0, 0, 25%);

    .feature {
      display: flex;
      gap: var(--gap);
      padding: var(--gap);
      border: 1px solid transparent;
      &:hover {
        border: 1px solid gray;
      }
      &.selected {
        border: 1px solid white;
      }
    }
  }
</style>
