<script lang="ts">
  import type { PageProps } from './$types';
  import MultiViewer from '$lib/v0.8/MultiViewer.svelte';
  import { MultiView, SingleView } from '$lib/v0.8/views.svelte';

  let { data }: PageProps = $props();

  let multiView: MultiView = new MultiView();
  // multiView.mode.type = "lens"

  const viewA = new SingleView();
  viewA.layers.add(`synced-maplibre-layer_${crypto.randomUUID()}`)

  const viewB = new SingleView();
  viewB.layers.add(`synced-maplibre-layer_${crypto.randomUUID()}`)

  let _;
  const viewC = new MultiView();
  _ = new SingleView();
  _.layers.add(`synced-maplibre-layer_${crypto.randomUUID()}`)
  viewC.views.add(_);
  _ = new SingleView();
  _.layers.add(`synced-maplibre-layer_${crypto.randomUUID()}`)
  viewC.views.add(_);

  const viewD = new MultiView();
  _ = new SingleView();
  _.layers.add(`synced-maplibre-layer_${crypto.randomUUID()}`)
  viewD.views.add(_);
  _ = new SingleView();
  _.layers.add(`synced-maplibre-layer_${crypto.randomUUID()}`)
  viewD.views.add(_);
  _ = new SingleView();
  _.layers.add(`synced-maplibre-layer_${crypto.randomUUID()}`)
  viewD.views.add(_);

  multiView.views.add(viewA)
  multiView.views.add(viewB)
  multiView.views.add(viewC)
  multiView.views.add(viewD)

  let camera = $state({
    zoom: undefined,
    center: undefined,
  })
</script>

<div
  style:height=100%
  style:width=100%
>
  <MultiViewer
    {...multiView}
    bind:camera
    bind:mode={multiView.mode}
  />
</div>
