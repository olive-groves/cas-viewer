// Breakpoints reduced in number improve performance.
// To parameterize, consider full LUTs with a means to reduce to n=8, n=5, etc.
// If n larger than LUT.length, floor to the length
const COLORMAPS = {  // Lowercase key, colors from low to high
	viridis: [  // https://hauselin.github.io/colorpalettejs/
		"#440154","#46327e","#365c8d","#277f8e","#1fa187","#4ac16d","#a0da39","#fde725"
	],
	viridis16: [  // https://hauselin.github.io/colorpalettejs/
		"#440154","#481a6c","#472f7d","#414487","#39568c","#31688e","#2a788e","#23888e","#1f988b","#22a884","#35b779","#54c568","#7ad151","#a5db36","#d2e21b","#fde725"
	],
	inferno: [  // https://hauselin.github.io/colorpalettejs/
		"#000004","#280b53","#65156e","#9f2a63","#d44842","#f57d15","#fac228","#fcffa4"
	],
	cividis: [  // https://hauselin.github.io/colorpalettejs/
		"#002051","#173a6d","#48546d","#706e71","#8e8978","#b1a775","#ddc75f","#fdea45"
	],
	magma: [  // https://hauselin.github.io/colorpalettejs/
		"#000004","#221150","#5f187f","#982d80","#d3436e","#f8765c","#febb81","#fcfdbf"
	],
	gray: [
		"#000", "#fff"
	],
	dimgray: [  // CET_L2 https://colorcet.com/gallery.html Peter Kovesi. Good Colour Maps: How to Design Them. arXiv:1509.03700 [cs.GR] 2015
		"#1c1c1c", "#f1f1f1"
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

	constructor(colormap = 'cividis', opacity = 1.0) {
		this.colormap = colormap;
		this.opacity = opacity;
	}
}