<div>
  <h1>Hello World</h1>
</div>

<div class="stack container">
  <div class=flex-spacer>
    <div>SPACER</div>
    <div>SPACER</div>
    <div>SPACER</div>
    <div>SPACER</div>
  </div>
  <div class=content>SHOULD BE CENTERED ON SCREEN</div>
</div>

<style>
  .container {
    flex: 1;
    min-height: 0;
    background-color: red;
  }
  .content {
    background-color: blue;
  }
  .flex-spacer {
    align-self: stretch;
    justify-self: start;
    overflow: auto;
    > * {
      height: 500px;
      border: 1px solid white;
    }
  }
</style>
