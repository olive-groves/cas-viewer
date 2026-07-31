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

  let drag = $state(false);
  let dragInner = $state(false);
  let dragOuter = $derived(drag && !dragInner);

  let dropzone = $state();
  let inner = $state();

  let dragEnteredSelf = $state(false);
</script>

<!-- <div
  bind:this={dropzone}
  class={["dropzone", "outer", {drag, dragOuter}]}
  ondragentercapture={(e) => {drag = true; console.log("drag-enter-capture", dragEnteredSelf = (e.target === dropzone))}}
  ondragenter={(e) => {console.log("drag-enter", (e.target === dropzone) ? "self" : "other")}}
  ondragleavecapture={(e) => {drag = dragInner; console.log("drag-leave-capture", (e.target === dropzone) ? "self" : "other")}}
  ondragleave={(e) => {
    console.log("drag-leave", (e.target === dropzone) ? "self" : (!dragEnteredSelf ? (drag = false) : ""))
  }}
  role=region
  aria-dropeffect=link
>
  <div
    bind:this={inner}
    ondragentercapture={(e) => {console.log("inner drag-enter-capture", (e.target === inner) ? "self" : "other")}}
    ondragenter={(e) => {dragInner = true; console.log("inner drag-enter", (e.target === inner) ? "self" : "other")}}
    ondragleavecapture={(e) => {console.log("inner drag-leave-capture", (e.target === inner) ? "self" : "other")}}
    ondragleave={(e) => {dragInner = false; console.log("inner drag-leave", (e.target === inner) ? "self" : "other")}}
    class={["inner", {drag, dragInner}]}
    role=region
    aria-dropeffect=link
  >
    {@render children?.()}
  </div>
</div> -->

<div
  bind:this={dropzone}
  class={["dropzone", "outer", {drag, dragOuter}]}
  ondragentercapture={(e) => {
    drag = true;
    dragEnteredSelf = e.target === dropzone;
  }}
  ondragleavecapture={() => {
    drag = dragInner;
  }}
  ondragleave={(e) => {
    if ((e.target !== dropzone) && !dragEnteredSelf) {
      drag = false;
    }
  }}
  role=region
  aria-dropeffect=link
>
  <div
    bind:this={inner}
    ondragenter={(e) => {
      dragInner = true
    }}
    ondragleave={(e) => {
      dragInner = false
    }}
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
        margin: 10%;
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
