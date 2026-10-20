<script lang="ts">
  import '@alenaksu/json-viewer';

  import { onMount } from 'svelte';
  import { SourceManager, type SourceKey } from '$lib/source-manager.svelte';
  import {
    sourceManager,
  } from "$lib/shared.svelte";
  sourceManager.sources.forEach((_, key) => sourceManager.delete(key));

  let sourceKeys: SourceKey[] = $state([]);

  const initialUrls: URL[] = [
    // new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url),
    // new URL('/local/bagunca-2025-10-21T1629/height.pmtiles', import.meta.url),
    // new URL('/local/impasto.png', import.meta.url),
    // new URL('/local/almond-blossom.jpg', import.meta.url),
  ];

  onMount(() => {
    const initialSourceKeys = initialUrls.map((url) => sourceManager.add(SourceManager.urlToSource(url)));
    sourceKeys.push(...initialSourceKeys)
  })

  async function handleAddFiles(files: FileList) {
    let keys = (await Promise.all([...files].map(async (file) => {
      return sourceManager.add(SourceManager.fileToSource(file));
    })));
    sourceKeys.push(...keys);
  }

  let dragging: boolean = $state(false);
</script>

<svelte:head>
	<title>Inspect PMTiles Header & Metadata</title>
</svelte:head>


<div id="taskbar">
  <div><h1>Source Inspector for PMTiles & Images</h1><p>View multiple PMTiles headers and metadata</p></div>
  <div class="add-sources">
    <input
      type="file"
      multiple
      accept=".pmtiles, .jpeg, .jpg, .png, .webp,"
      id="add-sources-input"
      onchange={(e) => {const files = (e.target as HTMLInputElement).files; if (files && files.length > 0) handleAddFiles(files);}}
    />
    <button onclick={() => (document.querySelectorAll(".add-sources")?.[0]?.querySelector("input[type=file]") as HTMLButtonElement)?.click()}>
      + PMTiles, JPEG, PNG, WEBP
    </button>
  </div>

  <div>
    {sourceKeys.length} source(s)
  </div>
</div>

<div
  class={["container", {initial: sourceKeys.length === initialUrls.length, dragging}]}
  ondragenter={() => dragging = true}
  ondragleave={() => dragging = false}
  ondragover={(e) => e.preventDefault()}
  ondrop={(e) => {const files = (e as DragEvent).dataTransfer?.files; if (files && files.length > 0) handleAddFiles(files); dragging = false; e.preventDefault();}}
  role=region
  aria-dropeffect=link
>

  {#each sourceKeys as key, i (key)}
    {@const source = sourceManager.sources.get(key)}
    {@const file = source?.file ? {name: source.file.name, size: source.file.size, type: source.file.type, lastModified: source.file.lastModified} : undefined}
    <div class="source">

      {#if source?.format === "pmtiles"}

        {#await Promise.all([source.header, source.metadata, source?.file]) then}
          <details open>
            <summary>{i + 1} · {source?.filename ?? source?.url ?? `Unknown name (source ${i + 1})`}</summary>
            <json-viewer>
              {JSON.stringify({...source, ...(file && {file})})}
            </json-viewer>
          </details>
        {/await}

      {:else}

        <details open>
          <summary>{i + 1} · {source?.filename ?? source?.url ?? `Unknown name (source ${i + 1})`}</summary>
          <json-viewer>
            {JSON.stringify({...source, ...(file && {file})})}
          </json-viewer>
        </details>

      {/if}
    </div>
  {/each}
</div>

<style>
  h1 {
    font-size: 3rem;
  }
  #taskbar {
    display: flex;
    align-items: flex-end;
    column-gap: 1rem;
    flex-wrap: wrap;
    padding: 8px;
  }
  .source {
    border: 1px solid alpha(from CanvasText / 10%);
    &:hover {
      border-color: alpha(from CanvasText / 40%);
    }
    padding: 4px;
  }
  .container {
    flex: 1 1;

    display: flex;
    flex-direction: column;
    overflow: auto;

    margin: 2px;
    padding: 2px;
    gap: calc(2 * var(--gap));
    border: 4px dashed transparent;
    &.initial {
      border-color: alpha(from CanvasText / 25%);
      &::after {
        display: block;
        align-self: center;
        overflow: hidden;
        content: "Drag & Drop · PMTiles, JPEG, PNG, WEBP";
        margin-block: auto;
      }
    }
    &.dragging {
      border-color: CanvasText;
      * {
        pointer-events: none;
      }
    }
  }
  button {
    border: 2px solid alpha(from CanvasText / 25%);
    padding-inline: 0.5em;
    &:focus-visible, &:hover {
      border-color: alpha(from CanvasText / 75%);
    }
  }
  input[type=file] {
    display: none;
  }
  summary {
    user-select: none;
    color: alpha(from CanvasText / 75%);
    &:hover {
      color: CanvasText;
      background: color-mix(in srgb, Canvas, CanvasText 10%);
    }
  }
</style>
