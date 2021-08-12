import { Pipe, PipeTransform } from '@angular/core';
import { sort } from '@equality/data';

@Pipe({
  name: 'sort'
})
export class ArraySortPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(array: any, field: string): any[] {
    if (!Array.isArray(array)) {
      return [];
    }
    return sort(array, (item) => item[field]);
  }
}
