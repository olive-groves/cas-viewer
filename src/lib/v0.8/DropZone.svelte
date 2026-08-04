<script lang="ts">
  let {
    ondrop,
    ondragenter,
    ondragleave,
    ondragover,
    draggingInnerChanged,
    draggingOuterChanged,
    dropEffect = "copy",
    children,
  }: {
    ondrop?;
    ondragenter?;
    ondragleave?;
    ondragover?;
    draggingInnerChanged?: (dragging: boolean) => void;
    draggingOuterChanged?: (dragging: boolean) => void;
    dropEffect?: string;
    children?;
  } = $props();

  // TODO: Add props for drag, drop, etc. inner and outer

	function handleDragenter(e) {
    ondragenter?.(e);
	}
	function handleDragenterInner(e) {
    ondragenter?.(e);
	}
	function handleDragleave(e) {
    ondragleave?.(e);
	}
	function handleDragleaveInner(e) {
    ondragleave?.(e);
	}
	function handleDragover(e) {
		e.dataTransfer.dropEffect = dropEffect;  // Trigger native link icon (macOS arrow).
    ondragover?.(e);
	}
	function handleDrop(e) {
    dragging = false;
    ondrop?.(e);
	}

	function ondropExample(e) {
    function handleFiles(files) {
      for (const file of files) {
        console.log(URL.createObjectURL(file));
      }
    }
	  const dt = e.dataTransfer;
	  const files = dt.files;
		if (files.length > 0) handleFiles(files);
	}

  let drags = $state(0);
  let innerDrags = $state(0);
  let dragging = $derived(drags > 0);
  let draggingInner = $derived(innerDrags > 0);
  let draggingOuter = $derived(dragging && !draggingInner);
  $effect(() => {
    draggingInnerChanged?.(draggingInner)
  })
  $effect(() => {
    draggingOuterChanged?.(draggingOuter)
  })
</script>

<div
  // WARNING: Children removed during ondrag- do not consistently propagate ondrag-.
  // Recommend hiding, not removing (if'ing) children that appear/disappear during drag.
  class={["dropzone", {dragging, draggingInner, draggingOuter}]}
  // Do not allow drags to exceed 2: Patch for adding/removing child flex elements.
  ondragenter={() => {if (drags < 2) drags += 1}}
  ondragleave={() => {drags -= 1}}
  role=region
  aria-dropeffect=link
>
  <div
    class=inner
    ondragenter={() => {if (innerDrags < 2) innerDrags += 1}}
    ondragleave={() => {innerDrags -= 1}}
    role=region
    aria-dropeffect=link
  >
    {@render children?.()}
  </div>
</div>


<style>
	.dropzone {
    display: flex;
    flex: 1 1;
    > .inner {
      display: flex;
      flex: 1 1;
      transition: margin 200ms ease-out;
    }
    &.dragging {
      > .inner {
        margin: 2rem;
      }
    }
    &.draggingInner {
      > .inner {
        outline: 1px solid oklch(1 0 0 / 50%);
        outline-offset: -1px;
        box-shadow: 0 0 0 1px oklch(0 0 0 / 50%);
      }
    }
    &.draggingOuter {
      outline: 1px solid oklch(1 0 0 / 50%);
      outline-offset: -1px;
      box-shadow: 0 0 0 1px oklch(0 0 0 / 50%);
    }
	}
</style>
