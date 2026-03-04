import { untrack } from "svelte";
import { getLargestLessThanOrEqualTo, getScientific, getSmallestGreaterThanOrEqualTo, pyrange, type MetricUnit, type NumberScientific } from "./Mathematics.svelte";
import type { Getter, NonEmptyArray } from "./utils";


// Unitless class that, given an axis min, axis max, and maximum number of ticks, gives you ticks and their interval
export class AxisBase {
    #minValue = $state(0);
    #maxValue = $state(10);
    #nMaxValue = $state(11);  // TODO: nMax = 1 fails, sometimes

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
    readonly nMax = $derived.by(() => {
        const getter = this.#nMaxGet;
        return getter ? getter() : this.#nMaxValue;
    })

    #withinDecade: NonEmptyArray<number> = [1, 2, 5];  // [1, 10), minimum 1 element

    readonly intervalScientific: NumberScientific = $derived.by(() => {
        let significand: number;
        let exponent: number;
        const unroundedIntervalScientific = getScientific(
            (this.max - this.min) / (this.nMax)
        )
        if (unroundedIntervalScientific.significand === 0) {
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
        return {significand, exponent}
    })
    readonly interval: number = $derived(
        this.intervalScientific.significand * 10 ** this.intervalScientific.exponent
    )
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
    scientific: NumberScientific,
    unit: MetricUnit,
    number: number,
}

// Display class that, given units, gives you the ticks in their nearest unit: value
export class AxisDisplay extends AxisBase {
    #units: MetricUnit[] = [
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

    #unitsExponents = $derived(this.#units.map(unit => unit.exponent));
    #preferredMinimumMagnitiude: number = -2;

    readonly displayInterval: DisplayLength = $derived.by(() => {
        const [exponent, i] = getLargestLessThanOrEqualTo(untrack(() => this.#unitsExponents), this.intervalScientific.exponent - this.#preferredMinimumMagnitiude);
        const unit = this.#units[i];
        const scientific = this.intervalScientific;
        scientific.exponent -= exponent;
        return {scientific, unit, number: this.interval / (10 ** exponent)}
    })

    readonly displayTicks: DisplayLength[] = $derived.by(() => {
        const [exponent, i] = getLargestLessThanOrEqualTo(untrack(() => this.#unitsExponents), this.intervalScientific.exponent - this.#preferredMinimumMagnitiude);
        const unit = this.#units[i];
        return this.ticks.map((tick) => {
            const scientific = getScientific(tick);
            scientific.exponent -= exponent
            return {scientific, unit, number: tick / (10 ** exponent)}
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

