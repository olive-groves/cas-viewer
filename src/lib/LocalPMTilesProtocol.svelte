<script lang="ts">
  import { Protocol as MapLibreProtocol } from 'svelte-maplibre-gl';
  import { Protocol, PMTiles } from 'pmtiles';

  let {
    scheme = 'pmtiles',
    pmtiles
  }: {
    scheme?: string,
    pmtiles?: PMTiles | PMTiles[]
  } = $props();

	const protocol = new Protocol();

  if (pmtiles instanceof PMTiles) {
    protocol.add(pmtiles);
  }
  if (Array.isArray(pmtiles)) {
    pmtiles.forEach((p) => protocol.add(p));
  }
</script>

<MapLibreProtocol {scheme} loadFn={protocol.tile} />
