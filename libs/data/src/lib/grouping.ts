// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Documentation : https://github.com/d3/d3-array/blob/master/README.md#group

function identity(x) {
    return x;
}

export function group<T>(values: Array<T>, ...keys) {
    return nest(values, identity, identity, keys);
}

function nest(values, map, reduce, keys) {
    return (function regroup(regroupValues, i) {
        if (i >= keys.length) { return reduce(regroupValues); }
        const groups = new Map();
        const keyof = keys[i++];
        let index = -1;
        for (const value of values) {
            const key = keyof(value, ++index, values);
            const g = groups.get(key);
            if (g) {
                g.push(value);
            } else {
                groups.set(key, [value]);
            }
        }
        const groupKeys = Array.from(groups.keys());
        for (const groupKey of groupKeys) {
            groups.set(groupKey, regroup(groups.get(groupKey), i));
        }
        return map(groups);
    })(values, 0);
}
