<script lang="ts">
  /**
   * Use like:
   *
   * <ClickToRevealButton>
   *   {#snippet button(reveal)}
   *     <button onclick={() => reveal()}>
   *       Reveal Content
   *     </button>
   *   {/snippet}
   *   <div>
   *     My content...
   *   </div>
   * </ClickToRevealButton>
  */

	import type { Snippet } from "svelte";

  let {
    initiallyRevealed = false,
    button,
    children,
  }: {
    initiallyRevealed?: boolean;
    button?: Snippet<[reveal: () => void]>;
    children?: Snippet;
  } = $props();

  // svelte-ignore state_referenced_locally
  let revealed = $state(initiallyRevealed);

  function reveal(): void {
    revealed = true;
  }
</script>

{#if revealed}
  {@render children?.()}
{:else}
  {@render button?.(reveal)}
{/if}
