<!-- https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ -->
<script lang="ts">
  let {
    value = $bindable(),
    placeholder = "",
  } = $props();
</script>

<div class="textarea-expander no-break-out">
  <textarea
    bind:value
    class="no-break-out"
    oninput={(e) => e.target.parentNode.dataset.textareaValue = e.target.value}
    {placeholder}
    rows="1"
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
      border-radius: var(--gap);
      font: inherit;
    }
  }
</style>
