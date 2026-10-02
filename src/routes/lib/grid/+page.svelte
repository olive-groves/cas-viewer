<script lang="ts">
  let show = $state(true);
</script>

<div class="minimap">
  <div class=map style:display={`${show ? "revert" : "none"}`}></div>
  <button class=button onclick={() => show = !show}>Toggle</button>
</div>

<style>
  .minimap {
    position: absolute;
    left: 50px;
    top: 100px;
    background-color: rgb(0, 255, 13);
    display: grid;
    width: fit-content;
    grid-template: auto 1fr / auto 1fr;
    .map {
      width: 50px;
      height: 180px;
      grid-area: 1 / 1 / -1 / -1;
      background-color: oklch(0.7 0.5 40);
    }
    .button {
      grid-area: 1 / 1;
    }
  }
</style>
