import { untrack } from "svelte";
import { getLargestLessThanOrEqualTo, ScientificNumber, getSmallestGreaterThanOrEqualTo, pyrange } from "./Mathematics.svelte";
import type { MetricUnit } from "./Mathematics.svelte";
import type { Getter, NonEmptyArray } from "./utils";


// Unitless class that, given an axis min, axis max, and maximum number of ticks, gives you ticks and their interval
export class AxisBase {
    #minValue = $state(0);
    #maxValue = $state(10);
    #nMaxValue = $state(11);  // TODO: nMax = 1 fails, sometimes, but this could be an implementation (flexbox) thing

    #minGet?: Getter<number>
    #maxGet?: Getter<number>
    #nMaxGet?: Getter<number>

    readonly min = $derived.by(() => {
        const getter = this.#minGet;
        return getter ? getter() : this.#minValue;
    })
    readonly max = $derived.by(() => {
        const getter = this.#maxGet;
        return getter ? getter() : this.#maxValue;
    })
    // nMax is the maximum number of ticks allowed.
    // There is an exception to this: When the start tick is equal to the min and the end tick is equal to the max, the resultant n may be +1 nMax.
    readonly nMax = $derived.by(() => {
        const getter = this.#nMaxGet;
        return getter ? getter() : this.#nMaxValue;
    })

    #withinDecade: NonEmptyArray<number> = [1, 2, 5];  // [1, 10), minimum 1 element

    readonly intervalScientific: ScientificNumber = $derived.by(() => {
        let significand: number;
        let exponent: number;
        const unroundedIntervalScientific = ScientificNumber.fromNumber(
            (this.max - this.min) / (this.nMax)
        )
        if (unroundedIntervalScientific.significand === 0 || this.nMax === 0) {
            significand = 0;
            exponent = 0;
        } else {
            significand = getSmallestGreaterThanOrEqualTo(
                this.#withinDecade,
                unroundedIntervalScientific.significand
            )[0];
            exponent = unroundedIntervalScientific.exponent;
            if (significand === undefined) {  // Guard if above the highest
                significand = this.#withinDecade.at(0)!;
                exponent += 1;
            }
        }
        return new ScientificNumber(significand, exponent)
    })
    readonly interval: number = $derived(this.intervalScientific.toNumber())
    readonly n: number = $derived(
        this.interval === 0
            ? 0
            : Math.floor(1 + (this.max / this.interval) - Math.ceil(this.min / this.interval))
    )
    readonly ticks: number[] = $derived(
        this.n === 0
            ? []
            : pyrange(this.n).map((i) =>
                Math.ceil(this.min / this.interval) * this.interval  // tick start
                + i * this.interval
            )
    )

    constructor(
        min?: number | Getter<number>,
        max?: number | Getter<number>,
        nMax?: number | Getter<number>,
        withinDecade?: NonEmptyArray<number>,
    ) {        
        if (typeof min === 'function') {
            this.#minGet = min;
        } else if (typeof min === 'number') {
            this.#minValue = min;
        }
        if (typeof max === 'function') {
            this.#maxGet = max;
        } else if (typeof max === 'number') {
            this.#maxValue = max;
        }
        if (typeof nMax === 'function') {
            this.#nMaxGet = nMax;
        } else if (typeof nMax === 'number') {
            this.#nMaxValue = nMax;
        }
        this.#withinDecade = withinDecade ?? this.#withinDecade;
    }
}

interface DisplayLength {
    scientific: ScientificNumber,
    unit: MetricUnit,
}

// Display class that, given units, gives you the ticks based on the interval's nearest unit
export class AxisDisplay extends AxisBase {
    #units: MetricUnit[] = [
        // TODO: Make easier to toggle? 'gimme mm and um only'
        // {
        //     exponent: 0,
        //     symbol: "",
        //     prefix: "",
        // },
        // {
        //     exponent: -2,
        //     symbol: "c",
        //     prefix: "centi",
        // },
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

    #unitsExponents = $derived(this.#units.map(unit => unit.exponent));
    #preferredMinimumMagnitiude: number = -2;

    readonly displayInterval: DisplayLength = $derived.by(() => {
        const interval = this.intervalScientific;
        const [exponent, i] = getLargestLessThanOrEqualTo(untrack(() => this.#unitsExponents), interval.exponent - this.#preferredMinimumMagnitiude);
        const unit = this.#units[i];
        return {scientific: new ScientificNumber(interval.significand, interval.exponent - exponent), unit}
    })

    readonly displayTicks: DisplayLength[] = $derived.by(() => {
        const [exponent, i] = getLargestLessThanOrEqualTo(untrack(() => this.#unitsExponents), this.intervalScientific.exponent - this.#preferredMinimumMagnitiude);
        const unit = this.#units[i];
        return this.ticks.map((tick) => {
            const scientific = ScientificNumber.fromNumber(tick);
            scientific.exponent -= exponent
            return {scientific, unit}
        })
    })

    constructor(
        min?: number | Getter<number>,
        max?: number | Getter<number>,
        nMax?: number | Getter<number>,
        withinDecade?: NonEmptyArray<number>,
        units?: MetricUnit[],
        preferredMinimumMagnitiude?: number,
    ) {  
        super(min, max, nMax, withinDecade);
        this.#units = (units ?? this.#units).sort((a, b) => a.exponent - b.exponent);
        this.#preferredMinimumMagnitiude = preferredMinimumMagnitiude ?? this.#preferredMinimumMagnitiude;
    }
}

