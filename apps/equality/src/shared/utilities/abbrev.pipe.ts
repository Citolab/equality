import { Pipe, PipeTransform } from '@angular/core';
import { getAbbrevCode } from '@equality/data';

@Pipe({ name: 'abbrev' })
export class AbbrevPipe implements PipeTransform {
  transform(value: string): string {
    return getAbbrevCode(value);
  }
}
