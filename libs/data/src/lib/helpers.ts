// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onlyUnique = (value: any, index: number, self: any) => {
    return self.indexOf(value) === index;
}

export const GetRandomNumber = (min: number, max: number, decimals: number): number => {
    return +(Math.random() * (max - min) + min).toFixed(decimals);
}

export const getAbbrevCode = (code: string) => {
    const splittedCode = code.split('-');
    return splittedCode[splittedCode.length - 1];
}

    
export function sort<T, K> (list: T[], getKey: (item: T) => K, desc = false) {
    list.sort((a: T, b: T) => {
        const valueA = getKey(a);
        const valueB = getKey(b);
        if (valueA < valueB) {
            return !desc ? -1 : 1;
        } else if (valueA > valueB) {
            return !desc ? 1 : -1;
        } else {
            return 0;
        }
    });
    return list;
}


export const groupBy = <T, K extends keyof unknown>(list: T[], getKey: (item: T) => K) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);