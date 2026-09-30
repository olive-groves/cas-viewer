<!-- https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ -->
<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

  let {
    value = $bindable(),
    placeholder = "",
    rows = 1,
  } = $props();

  // Replaces oninput={(e) => e.target.parentNode.dataset.textareaValue = e.target.value
  // because we also need to catch the value when it's changed externally.
	const updateText: Attachment = (element) => {
		element.parentNode.dataset.textareaValue = value;
	};
</script>

<div class="textarea-expander no-break-out">
  <textarea
    bind:value
    {@attach updateText}
    class="no-break-out"
    {placeholder}
    {rows}
  ></textarea>
</div>

<style>
  .textarea-expander {
    display: grid;

    &::after {
      /* Keep terminating space. */
      content: attr(data-textarea-value) " ";
      white-space: pre-wrap;
      visibility: hidden;
    }

    & > textarea {
      resize: none;
      overflow: hidden;
    }

    & > textarea,
    &::after {
      grid-area: 1 / 1 / -1 / -1;

      border: 1px solid transparent;
      border-radius: calc(var(--gap) / 2);
      font: inherit;
    }
  }
</style>
