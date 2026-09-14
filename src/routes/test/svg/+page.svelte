<div style:background-color=red>

  <svg
    width="200" height="103"
    viewBox="0 0 200 103"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMaxYMax meet"
  >
    <defs>
      <marker
        id="marker-arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="4"
        markerHeight="4"
        orient="auto-start-reverse"
        fill="white"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>

      <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
        <feDropShadow
          dx="3"  // --stroke-width * sqrt(2)?
          dy="3"  // --stroke-width * sqrt(2)?
          stdDeviation="0"
          flood-color="black"
          flood-opacity="1"
        />
      </filter>

      <mask id="mask-inner-outer">
        <circle cx="100" cy="100" r="100" fill="white" />
        <circle cx="100" cy="100" r="10" fill="black" />
      </mask>

    </defs>

    <!-- A line with a marker -->
    <g
      filter="url(#filter-shadow)"
    >
      <g
       mask="url(#mask-inner-outer)"
      >
        <rect
          id="_square-spanner"
          x="0"
          y="0"
          width="200"
          height="200"
          fill="transparent"
        />
        <line
          x1="200"  // --start-x
          y1="0"     // --start-y
          x2="100"
          y2="100"
          stroke="white"
          stroke-width="4"  // --stroke-width
        />
      </g>
      <line
        x1="200"  // --start-x
        y1="0"     // --start-y
        x2="100"
        y2="100"
        stroke-width="4"  // --stroke-width
        stroke="transparent"
        marker-end="url(#marker-arrow)"
      />
    </g>
  </svg>

</div>
<p>Hello World</p>
