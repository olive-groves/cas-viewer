<script lang="ts">
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<div class=root>
  <div class=tabbar>
    <div class=title>
      Very long text that should only collapse once all the tabs have collapsed
    </div>
    <div class=tabs>
      {#each {length: 6} as tab, i}
        <div>
          <button>Button {i}</button>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .tabbar {
    display: flex;
  }
  .title {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }
  .tabs {
    flex: 1 0 auto;
    width: min(100%, 0px);
    display: flex;
    gap: 1em;
    border: 1px solid blue;
    overflow-x: auto;
    * {
      white-space: nowrap;
    }
  }
  .root {
    position: absolute;
    left: 50px;
    top: 100px;
    width: 700px;
    resize: inline;
    height: 800px;
    background: gray;
    overflow: hidden;
  }
</style>
