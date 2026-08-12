<script lang="ts">
  //////////////////////////////////////////////////////////////////////////////////////
  // Orchestration of sources, synced layers, and multi-view...
  // Viewer Manager?
  import { sourceManager, syncedMapLibreLayers, multiView, syncedMapLibreSurfaces } from "$lib/shared.svelte";
  import { MapLibreSyncedLayer, MapLibreSyncedSurface, type AnyLayerSpec, type Background, type SurfaceSpec, type SyncedMapLibreLayerKey, type SyncedMapLibreSurfaceKey } from "$lib/synced-layer.svelte";
  import { setSourceManagerContext, setSyncedMapLibreLayersContext, setSyncedMapLibreSurfacesContext } from "$lib/shared-context.svelte";

  // FIXME: Clear for development purposes —————————————————————————————————————————————
  sourceManager.sources.forEach((_, key) => sourceManager.delete(key));
  syncedMapLibreLayers.forEach((_, key) => syncedMapLibreLayers.delete(key));
  syncedMapLibreSurfaces.forEach((_, key) => syncedMapLibreSurfaces.delete(key));
  multiView.views.map.forEach((_, key) => multiView.views.delete(key))
  // ———————————————————————————————————————————————————————————————————————————————————
  setSourceManagerContext(sourceManager);
  setSyncedMapLibreLayersContext(syncedMapLibreLayers);
  setSyncedMapLibreSurfacesContext(syncedMapLibreSurfaces);

  //////////////////////////////////////////////////////////////////////////////////////
  // Proof
  import { MultiView, SingleView } from "$lib/v0.8/views.svelte";
  import { SourceManager, type SourceKey } from "$lib/source-manager.svelte";
  import MultiViewer from "$lib/v0.8/MultiViewer.svelte";
  import { PMTilesProtocol } from "@svelte-maplibre-gl/pmtiles";

  let view;
  // view = new SingleView();
  // multiView.views.add(view)
  // view = new SingleView();
  // multiView.views.add(view)

  // let A = new MultiView();
  // A.name = "Multi-View A"
  // view = new SingleView();
  // A.views.add(view);
  // view = new SingleView();
  // A.views.add(view);
  // multiView.views.add(A)

  // let B = new MultiView();
  // B.name = "Multi-View B"
  // view = new SingleView();
  // B.views.add(view);
  // view = new SingleView();
  // B.views.add(view);
  // view = new SingleView();
  // B.views.add(view);
  // // multiView.views.add(B)

  // let BB = new MultiView()
  // BB.views.add(B);
  // let BBB = new MultiView()
  // BBB.views.add(BB);

  // multiView.views.add(BBB)

  async function deriveSyncedLayerFromMapLibreSource(
    mapLibreSourceKey: SourceKey,
    nOverrides: number,
  ) {
    const mapLibreSource = sourceManager.mapLibreSources.get(mapLibreSourceKey);
    if (mapLibreSource === undefined) return;
    const sourceSpec = {
      ...await mapLibreSource.source.spec,
      ...mapLibreSource?.override
    }

    if (sourceSpec.type === "raster" || sourceSpec.type === "image") {  // If raster, add a raster layer to each group
      const layerSpecType = "raster";
      const initialPaintSpec = {
        "raster-opacity": 0.8,
      }
      const layerSpec: AnyLayerSpec = {  // This isn't state(); the MapLibreSyncedLayer.spec is.
        source: mapLibreSourceKey,
        type: layerSpecType,
        layout: {visibility: "visible"},
        paint: initialPaintSpec,
      }
      const syncedLayer = new MapLibreSyncedLayer(layerSpec)
      const overrideKeys = [...Array(nOverrides).keys()].map(() => syncedLayer.addOverride({spec: {}}))
      const syncedLayerKey: SyncedMapLibreLayerKey = `synced-maplibre-layer_${crypto.randomUUID()}`;
      syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key
      // For each (single)view, add the synced layer with one of the overrides.
      multiView.views.order.forEach((viewKey, viewIndex) => {
        const view = multiView.views.map.get(viewKey);
        if (view?.type === "single") {
          (view as SingleView).layers.add(syncedLayerKey, {key: overrideKeys.at(viewIndex)})
        }
      })
    } else if (sourceSpec.type === "raster-dem") {  // If raster-dem, add a hillshade AND color-relief layer to each group
      const layerSpecTypes = ["color-relief", "hillshade"];
      layerSpecTypes.forEach((layerSpecType) => {
        const initialPaintSpec =
          layerSpecType === "hillshade" ?
          {
            "hillshade-illumination-direction": 90,
            "hillshade-exaggeration": 0.5,
          } :
          {
            'color-relief-color': [
              'interpolate',
              ['linear'],
              ['elevation'],
              0, 'rgba(0, 0, 0, 0)',
              1, 'rgba(4, 0, 108, 0.5)',
              5000, 'rgba(215, 5, 13, 0.5)'
            ]
          }
        const initialBackgroundSpec: Background | undefined =
          layerSpecType === "hillshade" ?
          {
            color: "#7f7f7f",
            opacity: 0.8,
            visibility: true,
          } :
          undefined
        const layerSpec: AnyLayerSpec = {  // This isn't state() and shouldn't be; the eventual MapLibreSyncedLayer.spec is.
          source: mapLibreSourceKey,
          type: layerSpecType,
          layout: {visibility: "visible"},
          paint: initialPaintSpec,
        }

        const syncedLayer = new MapLibreSyncedLayer(layerSpec, initialBackgroundSpec)
        const overrideKeys = [...Array(nOverrides).keys()].map(() => syncedLayer.addOverride({spec: {}}))
        const syncedLayerKey: SyncedMapLibreLayerKey = `synced-maplibre-layer_${crypto.randomUUID()}`;
        syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key
        // For each (single)view, add the synced layer with one of the overrides.
        multiView.views.order.forEach((viewKey, viewIndex) => {
          const view = multiView.views.map.get(viewKey);
          if (view?.type === "single") {
            (view as SingleView).layers.add(syncedLayerKey, {key: overrideKeys.at(viewIndex)})
          }
        })
      })
    }
  }

  async function derivedSyncedSurfaceFromMapLibreSource(
    mapLibreSourceKey: SourceKey,
    nOverrides: number,
  ) {
    const mapLibreSource = sourceManager.mapLibreSources.get(mapLibreSourceKey);
    if (mapLibreSource === undefined) {
      return
    }
    const sourceSpec = {
      ...await mapLibreSource.source.spec,
      ...mapLibreSource?.override
    }
    if (sourceSpec.type !== "raster-dem") {
      return
    }
    const surfaceSpec: SurfaceSpec = {
      source: mapLibreSourceKey,
      layout: {
        enabled: true,
        exaggeration: 10,
      }
    }
    const syncedSurface = new MapLibreSyncedSurface(surfaceSpec)
    const overrideKeys = [...Array(nOverrides).keys()].map(() => syncedSurface.addOverride({spec: {}}))
    const syncedSurfaceKey: SyncedMapLibreSurfaceKey = `synced-maplibre-surface_${crypto.randomUUID()}`;
    syncedMapLibreSurfaces.set(syncedSurfaceKey, syncedSurface);
    // For each (single)view, set the synced surface with one of the overrides.
    multiView.views.order.forEach((viewKey, viewIndex) => {
      const view = multiView.views.map.get(viewKey);
      if (view?.type === "single") {
        (view as SingleView).surface.overrideKey = overrideKeys.at(viewIndex);
        (view as SingleView).surface.syncedSurfaceKey = syncedSurfaceKey;
      }
    })
  }

  function handleFiles(files: FileList | null) {
    if (files) {
      [...files].forEach((file) => {
        deriveSyncedLayerFromMapLibreSource(
          sourceManager.add(SourceManager.fileToSource(file)),
          nViewers
        );
      })
    }
  }

  let camera = $state({
    zoom: undefined,
    center: undefined,
  })

</script>

<PMTilesProtocol pmtiles={sourceManager.pmtiles} />

<div style:display=flex style:height=100% style:width=100% style:overflow=hidden>
  <MultiViewer
    {...multiView}
    bind:camera
    bind:mode={multiView.mode}
    bind:preview={multiView.preview}
  />
</div>
