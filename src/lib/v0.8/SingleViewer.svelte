<script lang="ts">
  import maplibregl from 'maplibre-gl';
  import { BackgroundLayer, MapLibre } from 'svelte-maplibre-gl';
  import type { SingleView } from './views.svelte';

  let { layers, camera = $bindable({}) }: SingleView = $props();

  let map: maplibregl.Map | undefined = $state.raw();
</script>

<MapLibre
  bind:map
  inlineStyle={`height: var(--height, 100%); width: var(--width, 100%);`}
  renderWorldCopies={false}
  transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom: zoom ?? 0})}
  // We can't bind because it causes sync issues in 3D mode. For now update upon onmove.
  zoom={camera.zoom}
  center={camera.center}
  bearing={camera.bearing}
  pitch={camera.pitch}
  roll={camera.roll}
  elevation={camera.elevation}
  onmove={
    (e) => {
      if (e.originalEvent || e?.sync) {
        // e.sync is an event prop that we pass if easing or otherwise causing map move,
        // like the auto-pitch when enabling 3D:
        //    map.easeTo({zoom: 2}, {sync: true})
        camera.zoom = map?.getZoom();
        camera.center = map?.getCenter();
        camera.bearing = map?.getBearing();
        camera.pitch = map?.getPitch();
        camera.roll = map?.getRoll();
        camera.elevation = map?.getCameraTargetElevation();
      }
    }
  }
>
  {#each layers.order as overrideKey (overrideKey)}
    {@const syncedLayerKey = layers.map.get(overrideKey)}
    <BackgroundLayer
      paint={{"background-color": `hsl(${Math.floor(Math.random()*360)} 100% 50%)`}}
    />
  {/each}
</MapLibre>
