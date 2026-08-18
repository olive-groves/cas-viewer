<script lang="ts">
  //////////////////////////////////////////////////////////////////////////////////////
  // Orchestration of sources, synced layers, and multi-view...
  // Viewer Manager?
  import { sourceManager, syncedMapLibreLayers, multiView, syncedMapLibreSurfaces } from "$lib/shared.svelte";
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
  import ViewerWorkspace from "$lib/v0.8/ViewerWorkspace.svelte";
  import { MapLibreSyncedLayer, type AnyLayerSpec, type SyncedMapLibreLayerKey } from "$lib/synced-layer.svelte";

  const layerSpec: AnyLayerSpec = {  // This isn't state(); the MapLibreSyncedLayer.spec is.
    type: "background",
  }
  const syncedLayer = new MapLibreSyncedLayer(layerSpec);
  const syncedLayerKey: SyncedMapLibreLayerKey = `synced-maplibre-layer_${crypto.randomUUID()}`;
  syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key

  let view;
  let overrideKey;
  view = new SingleView();
  overrideKey = syncedLayer.addOverride({spec: {paint: {"background-color": "red"}}});
  view.layers.add(syncedLayerKey, {key: overrideKey});
  multiView.views.add(view);
  view = new SingleView();
  overrideKey = syncedLayer.addOverride({spec: {paint: {"background-color": "blue"}}});
  view.layers.add(syncedLayerKey, {key: overrideKey});
  multiView.views.add(view);

  let A = new MultiView();
  A.mode.type = "lens";
  A.name = "Multi-View A"
  view = new SingleView();
  overrideKey = syncedLayer.addOverride({spec: {paint: {"background-color": "green"}}});
  view.layers.add(syncedLayerKey, {key: overrideKey});
  A.views.add(view);
  view = new SingleView();
  overrideKey = syncedLayer.addOverride({spec: {paint: {"background-color": "yellow"}}});
  view.layers.add(syncedLayerKey, {key: overrideKey});
  A.views.add(view);
  multiView.views.add(A)

</script>

<div style:display=flex style:height=100% style:width=100% style:overflow=hidden>
  <ViewerWorkspace
    {multiView}
  />
</div>
