import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filter' })
export class FilterPipe implements PipeTransform {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(items: any[], field: string, filterBy: string): any[] {
        return items.filter(item => item[field] === filterBy);
    }
}
