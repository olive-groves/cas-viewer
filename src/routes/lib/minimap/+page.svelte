<script lang="ts">
  import { MapLibre } from 'svelte-maplibre-gl';
  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';
  import type { LayerSpecification } from 'maplibre-gl';
  import Minimap from '$lib/mapboxgl-minimap.js';

  let map = $state();

  // Extract the layers spec from the OSM style
  let layers: LayerSpecification[] = $state.raw([]);
  async function loadLayer() {
    fetch('https://tile.openstreetmap.jp/styles/openmaptiles/style.json')
      .then((response) => response.json())
      .then((data) => {
        layers = data['layers'].filter(
          (layer: LayerSpecification) => !('source' in layer) || layer.source === 'openmaptiles'
        );
      });
  }
</script>

<!-- Add pmtiles:// Protocol globally -->
<PMTilesProtocol />

{#await loadLayer()}
<div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%;">
  <p>Loading</p>
</div>
{:then}
  <!-- Use the pmtiles:// protocol -->
  <MapLibre
    bind:map={map}
    onload={() => {
      map.addControl(new Minimap({
        width: "180px",
        height: "180px",
        lineColor: "#fff",
        fillColor: "#fff",
        // zoom: -2,
        renderWorldCopies: false,
        style: {
          version: 8,
          glyphs: 'https://tile.openstreetmap.jp/fonts/{fontstack}/{range}.pbf',
          sprite: 'https://tile.openstreetmap.jp/styles/openmaptiles/sprite',
          sources: {
            openmaptiles: {
              type: 'vector',
              url: 'pmtiles://https://tile.openstreetmap.jp/static/planet.pmtiles',
              attribution: 'OSM Japan © OpenMapTiles © OpenStreetMap contributors'
            }
          },
          layers
        }}),
        'top-left'
      )
    }}
    inlineStyle="height: 100%; align-text: center"
    zoom={10}
    center={[12.484151635086198, 41.8960910478323]}
    style={{
      version: 8,
      glyphs: 'https://tile.openstreetmap.jp/fonts/{fontstack}/{range}.pbf',
      sprite: 'https://tile.openstreetmap.jp/styles/openmaptiles/sprite',
      sources: {
        openmaptiles: {
          type: 'vector',
          url: 'pmtiles://https://tile.openstreetmap.jp/static/planet.pmtiles',
          attribution: 'OSM Japan © OpenMapTiles © OpenStreetMap contributors'
        }
      },
      layers
    }}
  ></MapLibre>
{/await}
