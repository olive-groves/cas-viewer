<script lang="ts">
  interface NumberScientific {
    significand: number,
    exponent: number
  }
  function getScientific(num: number): NumberScientific {
    let significand;
    let exponent;
    [significand, exponent] = num.toExponential().split('e').map(Number);
    return {significand, exponent};
  }
  function getLargestLessThanOrEqualToFromSorted(list: number[], num: number): [number, number] {
    // Bisect a sorted, increasing array
    // https://stackoverflow.com/a/12071013/20921535
    let i = 0;
    let end = list.length;
    while ((end - i) > 1) {
        const cursor = Math.floor((i + end) / 2);;
        if (list[cursor] < num) {
            i = cursor;
        } else if (list[cursor] > num){
            end = cursor;
        } else {
            i = end = cursor;
        }
    }
    return [list[i], i];
  }

  // Genericize the context (zoom, screen pixels) from the backend (getting length)

  // Input
  let zoom: number = $state(3);  // Zoom
  
  // Parameters
  const withinDecade = [1, 2, 5];  // Sorted, increasing list of [1, 10)
  const unitNames = ["um", "mm", "cm", "m"]  // Sorted, increasing list of unit names
  const unitBases = [-6, -3, -2, 0]  // Matching unitNames

  const maxScreenPixels = 110;  // Maximum length in pixels of the scale bar
  const maxZoom = 5;
  const metersPerScreenPixel = 0.000345;  // TODO: Calculate this from zoom, maxZoom, and metersPerPixel

  // Calculated
  let max = $derived(maxScreenPixels * metersPerScreenPixel * 2 ** (maxZoom - zoom))
  let maxSci: NumberScientific = $derived(getScientific(max))

  const lengthSci: NumberScientific = $derived({
    significand: getLargestLessThanOrEqualToFromSorted(withinDecade, maxSci.significand)[0],
    exponent: maxSci.exponent
  })
  let length = $derived(lengthSci.significand * 10 ** lengthSci.exponent)  // Meters
  let lengthDisplay = $state();
  let lengthDisplayUnits = $state();
  $effect(() => {
    const [base, i] = getLargestLessThanOrEqualToFromSorted(unitBases, lengthSci.exponent);
    lengthDisplay = lengthSci.significand * 10 ** (lengthSci.exponent - base);
    lengthDisplayUnits = unitNames[i];
  })
  let lengthPixels;  // Eventual length of fitted scale bar in pixels

</script>

<label>
  Zoom
  <input type="number" step="0.5" bind:value={zoom}/>
</label>

<h2>
  Max length
</h2>
<div>
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Length</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>
          Base
        </th>
        <td>
          {max} m
        </td>
      </tr>
      <tr>
        <th>
          Scientific
        </th>
        <td>
          {maxSci.significand} × 10<sup>{maxSci.exponent}</sup>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Scale bar length</h2>
<div>
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Length</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>
          Base
        </th>
        <td>
          {length} m
        </td>
      </tr>
      <tr>
        <th>
          Scientific
        </th>
        <td>
          {lengthSci.significand} × 10<sup>{lengthSci.exponent}</sup>
        </td>
      </tr>
      <tr>
        <th>
          In nearest units
        </th>
        <td>
          {lengthDisplay} {lengthDisplayUnits}
        </td>
      </tr>
    </tbody>
  </table>
</div>
