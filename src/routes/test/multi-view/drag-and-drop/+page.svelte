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
  import MultiViewer from "$lib/v0.8/MultiViewer.svelte";
  import { PMTilesProtocol } from "@svelte-maplibre-gl/pmtiles";

  let view;
  // view = new SingleView();
  // multiView.views.add(view)
  // view = new SingleView();
  // multiView.views.add(view);

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

  // let BB = new MultiView()
  // BB.views.add(B);
  // let BBB = new MultiView()
  // BBB.views.add(BB);

  // multiView.views.add(BBB)

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
    bind:layout={multiView.layout}
  />
</div>
