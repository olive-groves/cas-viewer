<script lang="ts">
  import { OrderedSvelteMap } from '$lib/utils.svelte';
  import MultiViewer from '$lib/v0.8/MultiViewer.svelte';
  import { MultiView, SingleView } from '$lib/v0.8/views.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let multiView: MultiView = new MultiView();

  const viewA = new SingleView();
  viewA.layers.add("synced-layer-0", {key: "override-00"})
  // viewA.layers.add("synced-layer-1", {key: "override-10"})
  // viewA.layers.add("synced-layer-2", {key: "override-20"})
  // viewA.layers.add("synced-layer-3", {key: "override-30"})

  const viewB = new SingleView();
  viewB.layers.add("synced-layer-1", {key: "override-11"})
  // viewB.layers.add("synced-layer-2", {key: "override-21"})

  const viewC = new MultiView();
  viewC.mode.type = "lens";
  viewC.views.add(viewA, {key: "viewA"});
  viewC.views.add(viewB, {key: "viewB"});

  const viewD = new MultiView();
  viewD.mode.type = "lens";
  viewD.views.add(viewA, {key: "viewA"});
  viewD.views.add(viewB, {key: "viewB"});
  viewD.views.add(viewB, {key: "viewBB"});

  // multiView.views.add(viewA, {key: "view-i"})
  // multiView.views.add(viewB, {key: "view-ii"})
  // multiView.views.add(viewB, {key: "view-iii"})
  multiView.views.add(viewC, {key: "view-iv"})
  multiView.views.add(viewD, {key: "view-v"})

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
  />
</div>
