<script lang="ts">
  import type {
    GeoJSONStoreFeatures,
    GeoJSONStoreGeometries,
  } from 'terra-draw';
  import AutogrowTextArea from './AutogrowTextArea.svelte';
  import ClickToRevealButton from './ClickToRevealButton.svelte';
  import { SvelteMap } from 'svelte/reactivity';

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
  const tag_map = new SvelteMap([
    [
      "priority",
      {
        "description": "Requires immediate attention.",
      },
    ],
    [
      "follow-up",
      {
        "description": "Inspect on later date.",
      },
    ],
    [
      "unresolved",
      {
        "description": "Not yet addressed.",
      },
    ],
    [
      "resolved",
      {
        "description": "Addressed.",
      },
    ],
    [
      "verified",
      {
        "description": "Verified by visual inspection, microscope, or other method.",
      },
    ],
  ])

  const tag_ch = new SvelteMap([
    [
      "priority",
      {
        "chroma": undefined,
        "hue": 37,
      }
    ],
    [
      "follow-up",
      {
        "chroma": undefined,
        "hue": 200,
      }
    ],
    [
      "unresolved",
      {
        "chroma": undefined,
        "hue": 100,
      }
      ,
    ],
    [
      "resolved",
      {
        "chroma": undefined,
        "hue": 144,
      }
      ,
    ],
    [
      "verified",
      {
        "chroma": undefined,
        "hue": 254,
      }
    ],
  ])

  let {
    mode = "selected",
    properties = $bindable(),
    geometry,
    onEditClick,
    onSelectedCloseClick,
    onDoneClick,
    onDrawAnotherClick,
    onDeleteClick,
    onEditingCloseClick,
  }: {
    mode: "selected" | "editing";
    properties?: GeoJSONStoreFeatures<GeoJSONStoreGeometries>["properties"];
    geometry?: GeoJSONStoreFeatures<GeoJSONStoreGeometries>["geometry"];
    onEditClick?: () => void;
    onSelectedCloseClick?: () => void;
    onDoneClick?: () => void;
    onDrawAnotherClick?: () => void;
    onDeleteClick?: () => void;
    onEditingCloseClick?: () => void;
  } = $props();

  function p(n: number): "s" | "" {
    return n !== 1 ? "s" : "";
  }

  function getFriendlyLocalDateTime(datetime: Date["toISOString"]): string | undefined {
    if (typeof datetime !== "string")
      return undefined;
    const now = new Date();
    const date = new Date(datetime);
    let difference_ms = now.getTime() - date.getTime();
    let n: number;
    let f: string;
    if (difference_ms < 3000) {
      f = `A few seconds ago`
    } else if (difference_ms < 60000) {  // < 60 sec
      n = Math.round(difference_ms / 1000);
      f = `${n} second${p(n)} ago`;
    } else if (difference_ms < 3600000) {  // < 60 min
      n = Math.round(difference_ms / 60000);
      f = `${n} minute${p(n)} ago`;
    } else if (difference_ms < 86400000) {  // < 24 hr
      n = Math.round(difference_ms / 3600000);
      f = `${n} hour${p(n)} ago`;
    } else if (difference_ms < 604800000) {  // < 7 d
      n = Math.round(difference_ms / 86400000);
      f = `${n} day${p(n)} ago (${date.getDay()})`;
    } else {
      f = `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()} (${date.getDay()}) at ${date.getHours()}:${date.getMinutes()}`
    }
    return f
  }

</script>

<div class={["panel", mode]}>

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
      <div class="tags">
        {#each properties?.tags as tag}
          <div class="tag" style:--chroma={tag_ch.get(tag)?.chroma} style:--hue={tag_ch.get(tag)?.hue}>
            <div>
              {tag}
            </div>
          </div>
        {:else}
          <div class="unfilled">
            Untagged
          </div>
        {/each}
      </div>

      <div class="authorship">
        <div class="author">
          {properties?.["created-by"] ?? "Unknown author"}
        </div>
        <time datetime={properties?.created} title={properties?.created}>{getFriendlyLocalDateTime(properties?.created)}</time>
      </div>
      {#if properties?.title}
        <div class="title">
          <span class={{unfilled: !properties?.title}}>
            {properties?.title || `Untitled ${geometry?.type}`}
          </span>
        </div>
      {/if}
      {#if properties?.comment?.text}
        <div class="comment">
          <p>{properties?.comment?.text}</p>
        </div>
      {/if}
      {#if properties?.comment?.comments}
        <div class="replies">
          {#each properties?.comment?.comments as reply, i (i)}
            {#if reply?.text}
              <div class="reply">
                <div class="authorship">
                  <div class="author">
                    {reply?.["created-by"] ?? "Unknown author"}
                  </div>
                  <time datetime={reply?.created} title={reply?.created}>{getFriendlyLocalDateTime(reply?.created)}</time>
                </div>
                <p>{reply?.text}</p>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
    <div class="actionbar">
      <button onclick={() => onEditClick?.()}>
        Edit
      </button>
    </div>

  {:else if mode === "editing"}

    <div class="titlebar">
      <label class="category">
        <div class="unselectable">Category</div>
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
      <div class="tag-field">
        <div class="field-heading unselectable">
          Tags
        </div>
        <div class="tags">
          {#each properties?.tags as tag, i}
            <div class="tag" style:--chroma={tag_ch.get(tag)?.chroma} style:--hue={tag_ch.get(tag)?.hue}>
              <div>
                {tag}
              </div>
              <button onclick={() => properties?.tags.splice(i, 1)}>
                ×
              </button>
            </div>
          {/each}
          <ClickToRevealButton>
            {#snippet button(reveal)}
              <button onclick={() => reveal()}>
                + Tag
              </button>
            {/snippet}

            <select onchange={(e) => {
              const value = e.target?.value;
              if (value === undefined || value === "")
                return;
              if (properties?.tags?.includes(value))
                return;
              properties?.tags?.push(e.target.value);
              e.target.value = "";
            }}
            >
              <option value="">Select a tag</option>
              {#each [...tag_map.keys()].filter((t) => !properties?.tags.includes(t)) as tag}
                <option value={tag}>{tag}</option>
              {/each}
            </select>

          </ClickToRevealButton>
        </div>
      </div>
      <div class="title">
        <ClickToRevealButton initiallyRevealed={properties?.title}>
          {#snippet button(reveal)}
            <button onclick={() => reveal()}>
              + Title
            </button>
          {/snippet}

          <label>
            <div class="unselectable">Title</div>
            <input type="text"
              placeholder={`Untitled ${geometry?.type}`}
              bind:value={properties.title}
              maxlength="30"
              onkeyup={(e) => e.key === "Enter" && document.activeElement?.blur()}
            />
          </label>

        </ClickToRevealButton>
      </div>
      <div class="comment">
        <ClickToRevealButton initiallyRevealed={properties?.comment?.text}>
          {#snippet button(reveal)}
            <button onclick={() => reveal()}>
              + Comment
            </button>
          {/snippet}

          <label>
            <div class="unselectable">Comment</div>
            <AutogrowTextArea
              placeholder="Start a comment"
              bind:value={properties.comment.text}
              rows={2}
            />
          </label>

        </ClickToRevealButton>
      </div>
    </div>
    <div class="actionbar">
      <button class=primary onclick={() => onDoneClick?.()}>
        Done
      </button>
      <button onclick={() => onDrawAnotherClick?.()}>
        Done & Draw Another
      </button>
      <button onclick={() => onDeleteClick?.()}>
        Delete
      </button>
    </div>

  {/if}

</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    background: color-mix(in srgb, Canvas, CanvasText 8%);
    padding: var(--gap);
    border: 1px solid color-mix(in srgb, CanvasText, Canvas 80%);
    border-radius: var(--gap);

    button {
      text-transform: capitalize;
      padding: 0 calc(2 * var(--gap));
      &.primary {
        color: Canvas;
        background: CanvasText;
        &:hover {
          background: color-mix(in srgb, CanvasText, Canvas 10%);
        }
      }
    }
    .category {
      span,
      select {
        font-size: 1.35rem;
      }
    }
    .category::first-letter {
      text-transform: capitalize;
    }
    .unfilled {
      color: color-mix(in srgb, CanvasText, Canvas 30%);
    }
    .authorship {
      display: flex;
      font-size: 0.85rem;
      color: color-mix(in srgb, CanvasText, Canvas 40%);
      gap: calc(2 * var(--gap));
    }
    time {
      font-size: 0.85rem;
      color: color-mix(in srgb, CanvasText, Canvas 40%);
    }

    .titlebar {
      display: flex;
    }
    .actionbar {
      display: flex;
      flex-wrap: wrap;
      padding-top: calc(2 * var(--gap));
      gap: var(--gap);
    }
    .title {
      span,
      input[type=text] {
        font-size: 1.2rem;
      }
      padding-block-start: 0.5lh;
    }
    .comment,
    .reply {
      p {
        line-height: 0.85lh;
        color: color-mix(in srgb, CanvasText, Canvas 10%);
      }
    }
    .comment {
      margin-block-start: calc(-1 * var(--gap));
    }
    .replies {
      padding: calc(2 * var(--gap)) 0;
      display: flex;
      flex-direction: column;
      gap: calc(3* var(--gap));
      margin-inline-start: 1em;
    }
    .reply {
      display: flex;
      flex-direction: column;
    }
    label > div,
    .field-heading {
      font-size: 0.85rem;
      color: color-mix(in srgb, CanvasText, Canvas 25%);
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: var(--gap);
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: calc(var(--gap));
      .tag {

        --color: oklch(from CanvasText var(--lightness, 0.7) var(--chroma, 0.2) var(--hue, h));
        display: flex;
        font-size: 0.95rem;
        border: 1px solid var(--color);
        border-radius: var(--gap);
        color: color-mix(in oklch, var(--color), CanvasText 80%);
        background: color-mix(in oklch, var(--color), Canvas 85%);
        padding-inline: var(--gap);
        button {
          background: transparent;
          padding: 0 var(--gap);
        }
      }
    }
    &.editing {
      border: 1px solid color-mix(in srgb, CanvasText, Canvas 0%);
      .tag {
        padding-inline: 0;
        padding-inline-start: var(--gap);
      }
    }
  }

</style>
