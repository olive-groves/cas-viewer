<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  import * as maplibregl from 'maplibre-gl';
  import { BackgroundLayer, ColorReliefLayer, HillshadeLayer, ImageSource, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource, Terrain } from 'svelte-maplibre-gl';
  import type { SingleView } from './views.svelte';

  // import { sourceManager, syncedMapLibreLayers, syncedMapLibreSurfaces } from "$lib/shared.svelte";
  import { getSourceManagerContext, getSyncedMapLibreLayersContext, getSyncedMapLibreSurfacesContext } from "$lib/shared-context.svelte";
  const sourceManager = getSourceManagerContext();
  const syncedMapLibreLayers = getSyncedMapLibreLayersContext();
  const syncedMapLibreSurfaces = getSyncedMapLibreSurfacesContext();

  import { mergeDeep } from '$lib/utils';
  let { layers, surface, camera = $bindable({}), }: SingleView = $props();

  let map: maplibregl.Map | undefined = $state.raw();

  const SLOT_PREFIX = "slot-";
  const BACKGROUND_PREFIX = "background-";

  // Layers organized by source key
  let layersBySource = $derived(
    layers.map.entries().reduce(
      (uniqueSources, [overrideKey, syncedLayerKey]) => {
        const syncedLayer = syncedMapLibreLayers.get(syncedLayerKey);
        const sourceKey = syncedLayer?.overrides.get(overrideKey)?.spec?.source ?? syncedLayer?.spec.source;
        if (uniqueSources.get(sourceKey) === undefined) {
          const sourceLayerGroup = new Map([[overrideKey, syncedLayerKey]]);
          uniqueSources.set(sourceKey, sourceLayerGroup);
        } else {
          uniqueSources.get(sourceKey).set(overrideKey, syncedLayerKey)
        }
        return uniqueSources
      },
      new Map()
      )
  )

  // TODO: Force update of map for paint properties that don't play nice with surface.

  const MAPLIBRE_TIMEOUT_MILLISECONDS = 100;
  let refreshing: boolean = false;
  let refreshTimeout: number | undefined;
  function _refreshBeforeIds(target: maplibregl.Map) {
    // TODO: Refresh only if the "should-be" order differs from the current.
    // TODO: Function to generate the "should-be" order.
    console.warn("Refreshing")
    refreshing = true;
    // FIXME: This rigmarole is needed when nesting a multiview that itself has a nested multiview
    // const orderedLayerOverrides = layers?.order ?? [];
    let orderedLayerOverrides;
    try {
      orderedLayerOverrides = layers?.order ?? [];
    } catch (error) {
      console.warn("FIXME:", error);
      orderedLayerOverrides = [];
    }
    const currentOrder = target.getLayersOrder();
    // Set slot beforeId backwards, starting from second to last, because we "stack under"
    for (let i = orderedLayerOverrides.length - 2; i > -1; i--) {
      const id = `${SLOT_PREFIX}${orderedLayerOverrides.at(i)}`;
      const beforeId = `${SLOT_PREFIX}${orderedLayerOverrides.at(i + 1)}`;
      if (currentOrder.includes(id) && currentOrder.includes(beforeId)) {
        target.moveLayer(id, beforeId)
      }
    }
    orderedLayerOverrides.forEach(override => {
      if (currentOrder.includes(override) && currentOrder.includes(SLOT_PREFIX + override)) {
        target.moveLayer(override, SLOT_PREFIX + override);
      }
      if (currentOrder.includes(BACKGROUND_PREFIX + override) && currentOrder.includes(override)) {
        target.moveLayer(BACKGROUND_PREFIX + override, override);
      }
    })
    setTimeout(() => refreshing = false, 100)
  }
  function refreshBeforeIds(target: maplibregl.Map) {
    if (target?.isStyleLoaded() && !refreshing) {
      _refreshBeforeIds(target);
    } else {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(
        target => refreshBeforeIds(target),
        MAPLIBRE_TIMEOUT_MILLISECONDS
      );
    }
  }

  function handleOnData(e: maplibregl.MapDataEvent) {
    // FIXME: This is called when loading tiles, not just upon initial source load.
    // Thus, we're unnecessarily spamming it.
    // See TODO in _refreshBeforeIds().
    if (e?.isSourceLoaded) {
      refreshBeforeIds(e.target);
    }
  }

  $effect(() => {
    layers.order;
    if (map) {
      refreshBeforeIds(map);
    }
  })

</script>

<div class=map-container>
  <MapLibre
    bind:map
    inlineStyle="flex: 1 1;"
    // onload={handleOnData}
    ondata={handleOnData}
    renderWorldCopies={false}
    // attributionControl={false}
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
      <BackgroundLayer
        id={SLOT_PREFIX + overrideKey}
        layout={{visibility: "none"}}
      />
    {/each}
    {#each layersBySource as [sourceKey, layersOfSource] (sourceKey)}
      {@const source = sourceManager.mapLibreSources.get(sourceKey)}
      {#await source?.source.spec then sourceSpecOriginal}
        {@const sourceSpec = {...sourceSpecOriginal, ...source?.override, id: sourceKey}}
        {#if sourceSpec.type === "raster"}
          <RasterTileSource {...sourceSpec}>
            {#each layersOfSource.entries() as [overrideKey, syncedLayerKey]}
              {@const layer = syncedMapLibreLayers.get(syncedLayerKey)}
              <!-- This overwrites nested objects: {@const layerSpec = {...layer?.spec, ...layer?.overrides.get(overrideKey)?.spec}} -->
              <!-- We mergeDeep instead... -->
              {@const layerSpec = mergeDeep(layer?.spec, layer?.overrides.get(overrideKey)?.spec)}
              <RasterLayer
                id={overrideKey}
                paint={{...layerSpec.paint}}
                layout={{...layerSpec.layout}}
                beforeId={SLOT_PREFIX + overrideKey}
              />
            {/each}
          </RasterTileSource>
        {:else if sourceSpec.type === "raster-dem"}
          {@const {scheme, ...maplibreSpec} = sourceSpec}
          <RasterDEMTileSource {...maplibreSpec}>
            {#each layersOfSource.entries() as [overrideKey, syncedLayerKey]}
              {@const layer = syncedMapLibreLayers.get(syncedLayerKey)}
              {@const layerSpec = mergeDeep(layer?.spec, layer?.overrides.get(overrideKey)?.spec)}
              {#if layerSpec.type === "hillshade"}
                <HillshadeLayer
                  id={overrideKey}
                  paint={{...layerSpec.paint}}
                  layout={{...layerSpec.layout}}
                  beforeId={SLOT_PREFIX + overrideKey}
                />
              {:else if layerSpec.type === "color-relief"}
                <ColorReliefLayer
                  id={overrideKey}
                  paint={{...layerSpec.paint}}
                  layout={{...layerSpec.layout}}
                  beforeId={SLOT_PREFIX + overrideKey}
                />
              {/if}
            {/each}
          </RasterDEMTileSource>
        {:else if sourceSpec.type === "image"}
          <ImageSource {...sourceSpec}>
            {#each layersOfSource.entries() as [overrideKey, syncedLayerKey]}
              {@const layer = syncedMapLibreLayers.get(syncedLayerKey)}
              {@const layerSpec = mergeDeep(layer?.spec, layer?.overrides.get(overrideKey)?.spec)}
              <RasterLayer
                id={overrideKey}
                paint={{...layerSpec.paint}}
                layout={{...layerSpec.layout}}
                beforeId={SLOT_PREFIX + overrideKey}
              />
            {/each}
          </ImageSource>
        {/if}
      {/await}
    {/each}
    {#each layers.map as [overrideKey, syncedLayerKey] (overrideKey)}
      {@const syncedLayer = syncedMapLibreLayers.get(syncedLayerKey)}
      {@const override = syncedLayer?.overrides.get(overrideKey)}
      {@const background = mergeDeep(syncedLayer?.background ?? {}, override?.background ?? {}) }
      {@const layerVisibility = override?.spec?.layout?.visibility ?? syncedLayer?.spec?.layout?.visibility ?? "none"}
      <!-- TODO: Better default (hidden) background handling -->
      <BackgroundLayer
        id={BACKGROUND_PREFIX + overrideKey}
        beforeId={overrideKey}
        paint={{"background-color": background?.color ?? "rgb(0, 255, 0)", "background-opacity": background?.opacity ?? 0}}
        layout={{visibility: layerVisibility}}
      />
    {/each}
    {#if surface.overrideKey && surface.syncedSurfaceKey}
      {@const syncedSurface = syncedMapLibreSurfaces.get(surface.syncedSurfaceKey)}
      {@const sourceKey = syncedSurface?.overrides.get(surface.overrideKey)?.spec?.source ?? syncedSurface?.spec.source}
      {@const source = sourceManager.mapLibreSources.get(sourceKey)}
      {#await source?.source.spec then sourceSpecOriginal}
        {@const sourceSpec = {...sourceSpecOriginal, ...source?.override, id: sourceKey}}
        {@const {scheme, ...maplibreSpec} = sourceSpec}
        <RasterDEMTileSource {...maplibreSpec}>
          {@const surfaceSpec = mergeDeep(syncedSurface?.spec, syncedSurface?.overrides.get(surface.overrideKey)?.spec)}
          {#if surfaceSpec.layout.enabled}
            <Terrain exaggeration={surfaceSpec.layout.exaggeration} />
          {/if}
        </RasterDEMTileSource>
      {/await}
    {/if}

  </MapLibre>
</div>

<style>
  .map-container {
    display: flex;
    flex: 1;
  }
</style>
