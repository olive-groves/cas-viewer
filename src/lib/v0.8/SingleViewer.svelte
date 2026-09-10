<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  import * as maplibregl from 'maplibre-gl';
  import { BackgroundLayer, ColorReliefLayer, HillshadeLayer, ImageSource, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource, Terrain } from 'svelte-maplibre-gl';
  import type { SingleView, CameraState } from './views.svelte';
  import { TerraDraw } from '@svelte-maplibre-gl/terradraw';
  import TerraDrawDeluxe from './TerraDrawDeluxe.svelte';

  // import { sourceManager, syncedMapLibreLayers, syncedMapLibreSurfaces } from "$lib/shared.svelte";
  import {
    getSourceManagerContext,
    getSyncedMapLibreLayersContext,
    getSyncedMapLibreSurfacesContext,
    getSyncedTerraDrawContext,
  } from "$lib/shared-context.svelte";
  const sourceManager = getSourceManagerContext();
  const syncedMapLibreLayers = getSyncedMapLibreLayersContext();
  const syncedMapLibreSurfaces = getSyncedMapLibreSurfacesContext();
  const syncedTerraDraw = getSyncedTerraDrawContext();

  import { mergeDeep } from '$lib/utils';
  let {
    layers,
    surface,
    draw,
    zoom = $bindable(),
    lng = $bindable(0),
    lat = $bindable(0),
    bearing = $bindable(),
    pitch = $bindable(),
    roll = $bindable(),
    elevation = $bindable(),
    onzoomchange,
    onlngchange,
    onlatchange,
    onbearingchange,
    onpitchchange,
    onrollchange,
    onelevationchange,
  }: {
    layers: SingleView["layers"];
    surface?: SingleView["surface"];
    draw?: SingleView["draw"];
    zoom?: SingleView["camera"]["zoom"];
    lng?: SingleView["camera"]["lng"];
    lat?: SingleView["camera"]["lat"];
    bearing?: SingleView["camera"]["bearing"];
    pitch?: SingleView["camera"]["pitch"];
    roll?: SingleView["camera"]["roll"];
    elevation?: SingleView["camera"]["elevation"];
    onzoomchange?: (zoom: CameraState["zoom"]) => void;
    onlngchange?: (lng: CameraState["lng"]) => void;
    onlatchange?: (lat: CameraState["lat"]) => void;
    onbearingchange?: (bearing: CameraState["bearing"]) => void;
    onpitchchange?: (pitch: CameraState["pitch"]) => void;
    onrollchange?: (roll: CameraState["roll"]) => void;
    onelevationchange?: (elevation: CameraState["elevation"]) => void;
  } = $props();

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
    console.warn("Aggressively refreshing layer order.")
    refreshing = true;
    // FIXME: This rigmarole with `orderedLayerOverrides` is needed when nesting a
    // multiview that itself has a nested multiview. We can't simply use:
    //    const orderedLayerOverrides = layers?.order ?? [];
    let orderedLayerOverrides;
    try {
      orderedLayerOverrides = layers?.order ?? [];
    } catch (error) {
      console.warn("FIXME:", error);
      orderedLayerOverrides = [];
    }
    const currentOrder = target.getLayersOrder();

    // TerraDraw
    // Set last (top) override slot before the TerraDraw slot, because TerraDraw should
    // be kept on top
    const id = `${SLOT_PREFIX}${orderedLayerOverrides.at(-1)}`;
    const beforeId = `${SLOT_PREFIX}td`;
    if (currentOrder.includes(id) && currentOrder.includes(beforeId)) {
      target.moveLayer(id, beforeId)
    }
    const _terraDrawLayerIds = [  // This order, regardless of mode order
      'td-polygon',
      'td-polygon-outline',
      'td-linestring',
      'td-point',
      'td-point-marker',
    ]
    _terraDrawLayerIds.forEach((id) => {
      if (currentOrder.includes(id) && currentOrder.includes(beforeId)) {
        target.moveLayer(id, beforeId)
      }
    })

    // Layer slots
    // Set slot beforeId backwards, starting from second to last, because we "stack under"
    for (let i = orderedLayerOverrides.length - 2; i > -1; i--) {
      const id = `${SLOT_PREFIX}${orderedLayerOverrides.at(i)}`;
      const beforeId = `${SLOT_PREFIX}${orderedLayerOverrides.at(i + 1)}`;
      if (currentOrder.includes(id) && currentOrder.includes(beforeId)) {
        target.moveLayer(id, beforeId)
      }
    }

    // Layers belonging to those slots
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
      setTimeout(
        refreshBeforeIds,
        MAPLIBRE_TIMEOUT_MILLISECONDS,
        map,
      );
    }
  })

  $effect(() => {
    onzoomchange?.(zoom);
  })
  $effect(() => {
    onlngchange?.(lng);
  })
  $effect(() => {
    onlatchange?.(lat);
  })
  $effect(() => {
    onbearingchange?.(bearing);
  })
  $effect(() => {
    onpitchchange?.(pitch);
  })
  $effect(() => {
    onrollchange?.(roll);
  })
  $effect(() => {
    onelevationchange?.(elevation);
  })

  const center = $derived({lng, lat});
</script>

<div class=map-container>
  <MapLibre
    bind:map
    inlineStyle="flex: 1 1;"
    // onload={handleOnData}
    ondata={handleOnData}
    renderWorldCopies={false}
    attributionControl={false}
    transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom: zoom ?? 0})}
    // We can't bind because it causes sync issues in 3D mode. For now update upon onmove.
    {zoom}
    {center}
    {bearing}
    {pitch}
    {roll}
    {elevation}
    onmove={
      (e) => {
        if (e.originalEvent || e?.sync) {
          // e.sync is an event prop that we pass if easing or otherwise causing map move,
          // like the auto-pitch when enabling 3D:
          //    map.easeTo({zoom: 2}, {sync: true})
          zoom = map?.getZoom();
          const _center = map?.getCenter();
          lng = _center?.lng;
          lat = _center?.lat;
          bearing = map?.getBearing();
          pitch = map?.getPitch();
          roll = map?.getRoll();
          elevation = map?.getCameraTargetElevation();
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
                // beforeId={SLOT_PREFIX + overrideKey}
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
                  // beforeId={SLOT_PREFIX + overrideKey}
                />
              {:else if layerSpec.type === "color-relief"}
                <ColorReliefLayer
                  id={overrideKey}
                  paint={{...layerSpec.paint}}
                  layout={{...layerSpec.layout}}
                  // beforeId={SLOT_PREFIX + overrideKey}
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
                // beforeId={SLOT_PREFIX + overrideKey}
              />
            {/each}
          </ImageSource>
        {:else if typeof sourceKey === "undefined"}
          {#each layersOfSource.entries() as [overrideKey, syncedLayerKey]}
            {@const layer = syncedMapLibreLayers.get(syncedLayerKey)}
            {@const layerSpec = mergeDeep(layer?.spec, layer?.overrides.get(overrideKey)?.spec)}
            {#if layerSpec.type === "background"}
              <BackgroundLayer
                id={overrideKey}
                paint={{...layerSpec.paint}}
                layout={{...layerSpec.layout}}
                // beforeId={SLOT_PREFIX + overrideKey}
              />
            {/if}
          {/each}
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
        // beforeId={overrideKey}
        paint={{"background-color": background?.color ?? "rgb(0, 255, 0)", "background-opacity": background?.opacity ?? 0}}
        layout={{visibility: layerVisibility}}
      />
    {/each}
    {#if surface?.overrideKey && surface?.syncedSurfaceKey}
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

    {#if draw?.instanceKey}
      {@const instance = syncedTerraDraw.instances.get(draw?.instanceKey)}
      {#if instance}
        <BackgroundLayer
          id={SLOT_PREFIX + "td"}
          layout={{visibility: "none"}}
        />
        <TerraDrawDeluxe
          mode={syncedTerraDraw.mode}
          {instance}
          bind:this={instance.component}
        />
      {/if}
    {/if}
  </MapLibre>
</div>

<style>
  .map-container {
    display: flex;
    flex: 1;
  }
</style>
