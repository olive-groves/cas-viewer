<script lang="ts">
  let {
    ondrop,
    ondragenter,
    ondragleave,
    ondragover,
    dropEffect = "copy",
    children,
  }: {
    ondrop?;
    ondragenter?;
    ondragleave?;
    ondragover?;
    dropEffect?: string;
    children?;
  } = $props();

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
    drag = false;
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
  let drag = $derived(drags > 0);
  let dragInner = $derived(innerDrags > 0);
  let dragOuter = $derived(drag && !dragInner);
</script>

<div
  class={["dropzone", {drag, dragInner, dragOuter}]}
  ondragenter={() => drags += 1}
  ondragleave={() => drags -= 1}
  role=region
  aria-dropeffect=link
>
  <div
    class=inner
    ondragentercapture={() => innerDrags += 1}
    ondragleavecapture={() => innerDrags -= 1}
    role=region
    aria-dropeffect=link
  >
    {@render children?.()}
  </div>
</div>


<style>
	.dropzone {
    display: flex;
    height: 100%;
    width: 100%;
    .inner {
      width: 100%;
    }
    &.drag {
      > .inner {
        margin: 2rem;
      }
    }
    &.dragInner {
      > .inner {
        outline: 1px solid oklch(1 0 0 / 50%);
        outline-offset: -1px;
        box-shadow: 0 0 0 1px oklch(0 0 0 / 50%);
      }
    }
    &.dragOuter {
      outline: 1px solid oklch(1 0 0 / 50%);
      outline-offset: -1px;
      box-shadow: 0 0 0 1px oklch(0 0 0 / 50%);
    }
	}
</style>
