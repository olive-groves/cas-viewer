<script lang="ts">
	import { Protocol as MapLibreProtocol } from 'svelte-maplibre-gl';
	import { PMTiles, Protocol } from 'pmtiles';

  let {
    scheme = 'pmtiles',
    file
  } = $props();
	const protocol = new Protocol();
  protocol.add(file);
</script>

<MapLibreProtocol {scheme} loadFn={protocol.tile} />
