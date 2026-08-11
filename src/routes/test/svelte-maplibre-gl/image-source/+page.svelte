<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  import {
    MapLibre,
    RasterLayer,
    ImageSource,
    Marker,
  } from 'svelte-maplibre-gl';

  let url = $state('/web-app-manifest-512x512.png');

  let lnglats: [[number, number], [number, number], [number, number], [number, number]] = $state([
    [-45, 45],
    [0, 45],
    [0, 0],
    [-45, 0],
  ])

  function handleFiles(files: FileList | null) {
    if (files) {
      url = URL.createObjectURL(files[0]);
    }
  }

  $effect(() => {
    console.log("new url", url)
    return () => {  // return callback runs immediately before effect re-runs
      URL.revokeObjectURL(url);
      console.log("old url", url);
    }
  })
</script>

<div style={'display: flex; flex-direction: column; height: 100%; width: 100%;'}>
  <input type=file onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}/>
  <MapLibre
    renderWorldCopies={false}
    inlineStyle="width: 100%; height: 100%;"
    style="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
  >
    <ImageSource
      url={url}
      coordinates={lnglats}
    >
      <RasterLayer paint={{resampling: 'nearest'}}/>
    </ImageSource>
    {#each lnglats as lnglat, i}
      <Marker bind:lnglat={lnglats[i]} draggable >
      </Marker>
    {/each}
  </MapLibre>
</div>
