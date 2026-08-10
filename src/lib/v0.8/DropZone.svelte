<script lang="ts">
  let {
    ondragenter,
    ondragleave,
    ondragover,
    ondrop,
    ondragenterInner,
    ondragleaveInner,
    ondragoverInner,
    ondropInner,
    ondragenterOuter,
    ondragleaveOuter,
    ondragoverOuter,
    ondropOuter,
    draggingChanged,
    draggingInnerChanged,
    draggingOuterChanged,
    children,
  }: {
    ondragenter?: (event) => void;
    ondragleave?: (event) => void;
    ondragover?: (event) => void;
    ondrop?: (event) => void;
    ondragenterInner?: (event) => void;
    ondragleaveInner?: (event) => void;
    ondragoverInner?: (event) => void;
    ondropInner?: (event) => void;
    ondragenterOuter?: (event) => void;
    ondragleaveOuter?: (event) => void;
    ondragoverOuter?: (event) => void;
    ondropOuter?: (event) => void;
    draggingChanged?: (dragging: boolean) => void;
    draggingInnerChanged?: (dragging: boolean) => void;
    draggingOuterChanged?: (dragging: boolean) => void;
    children?;
  } = $props();

	function handleDragenter(e) {
    if (draggingOuter) ondragenterOuter?.(e);
    ondragenter?.(e);
	}
	function handleDragleave(e) {
    if (draggingOuter) ondragleaveOuter?.(e);
    ondragleave?.(e);
	}
	function handleDragover(e) {
    if (draggingOuter) ondragoverOuter?.(e);
    ondragover?.(e);
	}
	function handleDrop(e) {
    if (draggingOuter) ondropOuter?.(e);
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
    draggingChanged?.(dragging);
  })
  $effect(() => {
    draggingInnerChanged?.(draggingInner);
  })
  $effect(() => {
    draggingOuterChanged?.(draggingOuter);
  })
</script>

<div
  // WARNING: Children removed during ondrag- do not consistently propagate ondrag-.
  // Recommend hiding, not removing (if'ing) children that appear/disappear during drag.
  class={["dropzone", {dragging, draggingInner, draggingOuter}]}
  // Do not allow drags to exceed 2: Patch for adding/removing child flex elements.
  ondragenter={(e) => {if (drags < 2) drags += 1; handleDragenter(e);}}
  ondragleave={(e) => {drags -= 1; handleDragleave(e);}}
  ondragover={handleDragover}
  ondrop={(e) => {handleDrop(e); drags = 0;}}
  role=region
  aria-dropeffect=link
>
  <div
    class=inner
    ondragenter={(e) => {if (innerDrags < 2) innerDrags += 1; ondragenterInner?.(e);}}
    ondragleave={(e) => {innerDrags -= 1; ondragleaveInner?.(e);}}
    ondragover={(e) => ondragoverInner?.(e)}
    ondrop={(e) => {ondropInner?.(e); innerDrags = 0; drags = 0;}}
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
      gap: var(--gap);
      display: flex;
      flex-direction: var(--flex-direction);
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
