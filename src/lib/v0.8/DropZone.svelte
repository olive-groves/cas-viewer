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
    drag = true;
    dragOuter = true;
    dragInner = false;
    ondragenter?.(e);
	}
	function handleDragenterInner(e) {
    dragOuter = false;
    dragInner = true;
    ondragenter?.(e);
	}
	function handleDragleave(e) {
    drag = dragInner;
    dragOuter = false;
    ondragleave?.(e);
	}
	function handleDragleaveInner(e) {
    drag = dragOuter;
    dragInner = false;
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
  class={["dropzone", "outer", {drag, dragOuter}]}
  ondragentercapture={() => drags += 1}
  ondragleave={() => drags -= 1}
  role=region
  aria-dropeffect=link
>
  <div
    ondragenter={() => innerDrags += 1}
    ondragleave={() => innerDrags -= 1}
    class={["inner", {drag, dragInner}]}
    role=region
    aria-dropeffect=link
  >
    {@render children?.()}
  </div>
</div>


<style>
	.dropzone {
    display: flex;
    background-color: lightblue;
    height: 100%;
    width: 100%;
    &.dragOuter {
      background-color: blue;
    }
    &.drag {
      > .inner {
        margin: 4em;
      }
    }
    .inner {
      background-color: lightcoral;
      width: 100%;
      &.dragInner {
        background-color: red;
      }
    }
	}
</style>
