import { untrack } from "svelte";
import { getLargestLessThanOrEqualTo, getScientific } from "./Mathematics.svelte";
import type { MetricUnit, NumberScientific } from "./Mathematics.svelte";
import type { Getter, NonEmptyArray } from "./utils";

// max length in pixels (length max pixels)
//  get real-world max length in meters (length max meters)

    // max length (num)
    //  get floored to largest within-decade (floored)
    //      getLargestLessThanOrEqualToFromSorted(withinDecade, max.significand)

    // within-decade (num)
    //  get lowest integer representation amongst units, and its unit

// real-world length in meters (length meters)
//  get length in pixels (length pixels)


// I want a scale bar pixel length max 110px
// I want increments of 1, 2, 5
// I want to show um, mm, cm, m
// I want decimal shift -1 (show 0.1 mm rather than 100 um)

// Tell me the scale bar pixel length
// Tell me the scale bar real-world length in base units (in m)
// Tell me the scale bar real-world length in display units (in um)
// Tell me the scale bar real-world length display units ("um")

// Scale bar in base units (meters). Conversion to pixels is a separate concern.
// Give a maximum length in base units (meter), get a largest-less-than length in base and display units

class ScaleBarBase {
    #lengthMaxValue = $state(0);
    #lengthMaxGet?: Getter<number>

    readonly lengthMax = $derived.by(() => {
        const getter = this.#lengthMaxGet;
        return getter ? getter() : this.#lengthMaxValue;
    })
    readonly lengthMaxSci: NumberScientific = $derived(getScientific(this.lengthMax))

    #withinDecade: NonEmptyArray<number> = [1, 2, 3, 5];  // [1, 10), minimum 1 element

    readonly lengthSci: NumberScientific = $derived.by(() => {
        const lengthMaxSci = this.lengthMaxSci;
        let significand: number;
        let exponent: number;
        if (lengthMaxSci.significand === 0) {
            significand = 0;
            exponent = 0;
        } else {
            significand = getLargestLessThanOrEqualTo(this.#withinDecade, lengthMaxSci.significand)[0];
            exponent = lengthMaxSci.exponent;
            if (lengthMaxSci.significand < significand) {  // Guard if below the lowest
                significand = this.#withinDecade.at(-1)!;
                exponent -= 1;
            }
        }
        return {significand, exponent}
    });
    readonly length = $derived(this.lengthSci.significand * 10 ** this.lengthSci.exponent) 

    constructor(lengthMax?: number | Getter<number>, withinDecade?: NonEmptyArray<number>) {        
        if (typeof lengthMax === 'function') {
            this.#lengthMaxGet = lengthMax;
        } else if (typeof lengthMax === 'number') {
            this.#lengthMaxValue = lengthMax;
        }
        this.#withinDecade = withinDecade ?? this.#withinDecade;
    }
}

interface DisplayLength {
    value: number,
    unit: MetricUnit,
}

export class ScaleBarDisplay extends ScaleBarBase {
    readonly #units: MetricUnit[] = [
        {
            exponent: 0,
            symbol: "",
            prefix: "",
        },
        {
            exponent: -2,
            symbol: "c",
            prefix: "centi",
        },
        {
            exponent: -3,
            symbol: "m",
            prefix: "milli",
        },
        {
            exponent: -6,
            symbol: "μ",
            prefix: "micro",
        },
    ]
    // Magnitude at which to prefer:
    //      0 -> 1 cm instead of 10 mm
    //      1 -> 10 mm instead of 1 cm
    //      -2 -> 0.01 m instead of 1 cm
    readonly #preferredMinimumMagnitiude: number = 0;

    readonly #unitsExponents = $derived(this.#units.map(unit => unit.exponent));

    readonly displayLength: DisplayLength = $derived.by(() => {
        const lengthSci = this.lengthSci;
        const [exponent, i] = getLargestLessThanOrEqualTo(untrack(() => this.#unitsExponents), lengthSci.exponent - this.#preferredMinimumMagnitiude);
        const value = lengthSci.significand * 10 ** (lengthSci.exponent - exponent);
        const unit = this.#units[i];
        return {value, unit}
    })

    constructor(
        lengthMax?: number | Getter<number>,
        withinDecade?: NonEmptyArray<number>,
        units?: MetricUnit[],
        preferredMinimumMagnitiude?: number,
    ) {
        super(lengthMax, withinDecade);
        this.#units = (units ?? this.#units).sort((a, b) => a.exponent - b.exponent);
        this.#preferredMinimumMagnitiude = preferredMinimumMagnitiude ?? this.#preferredMinimumMagnitiude;
    }
}