// Breakpoints reduced in number improve performance.
// To parameterize, consider full LUTs with a means to reduce to n=8, n=5, etc.
// If n larger than LUT.length, floor to the length
const COLORMAPS = {  // Lowercase key, colors from low to high
	viridis: [  // https://waldyrious.net/viridis-palette-generator/
		"#440154",
		"#46327e",
		"#365c8d",
		"#277f8e",
		"#1fa187",
		"#4ac16d",
		"#a0da39",
		"#fde725",
	],
	grayscale: [
		"#000",
		"#fff"
	]
};

export class ColorRelief {
	colormap = $state();
	opacity = $state();
	colorReliefLayerVisibility = $state("visible");
	#colormapArray = $derived(COLORMAPS[this.colormap]);

	setBreakpoints = $state({
		low: 20,
		high: 60,
		min: 0,
		max: 100,
		step: 5,
	});

	#colorReliefColorLayerBreakpoints = $derived.by(() => {
		let layerBreakpoints = [];
		const n = this.#colormapArray.length,
					low = this.setBreakpoints.low,
					high = this.setBreakpoints.high,
					slope = (high - low) / (n - 1);
		for (let i = 0; i < n; i++) {
			const breakpoint = slope * i + low;
			layerBreakpoints.push(breakpoint, this.#colormapArray.at(i));
		}
		return layerBreakpoints;
	});

	#colorReliefColorLayer = $derived([
		"interpolate-hcl",
		["linear"],
		["elevation"]
	].concat(this.#colorReliefColorLayerBreakpoints));

	paint = $derived({
		"color-relief-opacity": this.opacity,
		"color-relief-color": this.#colorReliefColorLayer
	});
	
	layout = $derived({
		"visibility": this.colorReliefLayerVisibility,  // layout, not paint
	})

	constructor(colormap = 'viridis', opacity = 1.0) {
		this.colormap = colormap;
		this.opacity = opacity;
	}
}