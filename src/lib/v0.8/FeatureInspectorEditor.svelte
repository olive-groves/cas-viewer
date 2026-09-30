<script lang="ts">
  import type {
    GeoJSONStoreFeatures,
    GeoJSONStoreGeometries,
  } from 'terra-draw';
  import AutogrowTextArea from './AutogrowTextArea.svelte';

  // Process/technique terminology... https://www.getty.edu/vow/AATHierarchy?find=chalking&logic=AND&note=&page=1&subjectid=300229438
  // Condition/effect terminology... https://www.getty.edu/vow/AATHierarchy?find=chalking&logic=AND&note=&page=1&subjectid=300209168
  const processes_and_techniques = {
    "condition changing (processes)": {
      "surface or structural changes": {
        "cracking": "Fracturing in a material or object, usually along a single or branched path.",
        "lifting": " Partial rising of a topcoat such as a paint, solvent, or varnish layer, due to the break in adhesion to the undercoat or surface layer.",
        "powdering": "The act or process of reducing to powder, pulverization; in conservation science context refers to granular disintegration of stone and pigments.",
        "blistering": "The process that causes blisters, which are areas bulging out from the main mass or surface, such as paint.",
      },
      "color changes": {
        "discoloration": "Any change in the color of an object.",
        "fading": "A gradual loss of color or intensity.",
      },
      "warping": "Bending or twisting out of shape, such as that caused by drying, dampness, or heat.",
    },
    "physicochemical processes": {
      "saponification": "A process involving hydrolysis of an organic compound especially by alkali with the formation of salts of the fatty acids together with glycerol resulting in soap or soapy deposits.",
    }
  }
  const processes_and_techniques_as_effect = {
    "condition changing (processes)": {
      "surface or structural changes": {
        "crack": "Cracking · Fracturing in a material or object, usually along a single or branched path.",
        "lift": "Lifting · Partial rising of a topcoat such as a paint, solvent, or varnish layer, due to the break in adhesion to the undercoat or surface layer.",
        "powder": "Powdering · The act or process of reducing to powder, pulverization; in conservation science context refers to granular disintegration of stone and pigments.",
        "blister": "Blistering · The process that causes blisters, which are areas bulging out from the main mass or surface, such as paint.",
      },
      "color changes": {
        "discolor": "Discoloration · Any change in the color of an object.",
        "fade": "Fading · A gradual loss of color or intensity.",
      },
      "warp": "Warping · Bending or twisting out of shape, such as that caused by drying, dampness, or heat.",
    },
    "physicochemical processes": {
      "soap": "Saponification · A process involving hydrolysis of an organic compound especially by alkali with the formation of salts of the fatty acids together with glycerol resulting in soap or soapy deposits.",
    },
    "Non-Getty Art & Architecture Thesaurus": {
      "Non-Getty Art & Architecture Thesaurus": {
        "loss": "Missing original material due to damage, aging, or deterioration.",
      },
    },
  }

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
      <div class="category">
        <span class={{unfilled: !properties.category}}>
          {properties.category || "uncategorized"}
        </span>
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
    <div class="content">
      <div>
        <span class={{unfilled: !properties?.title}}>
          {properties?.title || `Untitled ${geometry?.type}`}
        </span>
      </div>
    </div>
    <div class="actionbar">
      <button onclick={() => onEditClick?.()}>
        Edit
      </button>
      <button onclick={() => onDrawAnotherClick?.()}>
        Draw Another {geometry?.type}
      </button>
    </div>
  {:else if mode === "editing"}
    <div class="titlebar">
      <label>
        <select bind:value={properties.category}>
          <option value="">Select a category</option>
          {#each Object.values(processes_and_techniques_as_effect) as supervalue (supervalue)}
            {#each Object.entries(supervalue) as [key, value] (key)}
              {#if typeof value === "string"}
                <option value={key.toLowerCase()} title={value}>
                  {key}
                </option>
              {:else}
                <optgroup label={key}>
                  {#each Object.entries(value) as [key, subvalue] (key)}
                    {#if typeof subvalue === "string"}
                      <option value={key.toLowerCase()} title={subvalue}>
                        {key}
                      </option>
                    {/if}
                  {/each}
                </optgroup>
              {/if}
            {/each}
          {/each}
        </select>
      </label>
      <div style:margin-inline-start=auto>
        <button onclick={() => onEditingCloseClick?.()}>
          ×
        </button>
      </div>
    </div>
    <div class="content">
      <div class="title">
        <input
          type="checkbox"
          checked={false}
        />
        <div class="title">
          <input type="text"
            placeholder={`Untitled ${geometry?.type}`}
            bind:value={properties.title}
          />
        </div>
      </div>
    </div>
    <div class="actionbar">
      <button onclick={() => onDoneClick?.()}>
        Done
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
      text-transform: capitalize;
      padding: 0 calc(2 * var(--gap));
    }
    .category::first-letter {
      text-transform: capitalize;
    }
    .unfilled {
      color: color-mix(in srgb, CanvasText, Canvas 50%);
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
