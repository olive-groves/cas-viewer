export interface NumberScientific {
    significand: number,
    exponent: number,
}
export function getScientific(num: number): NumberScientific {
    let significand;
    let exponent;
    [significand, exponent] = num.toExponential().split('e').map(Number);
    return {significand, exponent};
}
export interface MetricUnit {
    symbol: string,
    prefix: string,
    exponent: number,
}

export function getLargestLessThanOrEqualTo(list: number[], num: number): [number, number] {
    // Example:
    //  list = [1, 4, 7], num = 3 -> 1
    //  list = [1, 4, 7], num = 4 -> 4
    //  list = [1, 4, 7], num = 5 -> 4
    //  list = [1, 4, 7], num = 100 -> 7
    //  list = [1, 4, 7], num = -8 -> 1  Does not fail if less than lowest!
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
