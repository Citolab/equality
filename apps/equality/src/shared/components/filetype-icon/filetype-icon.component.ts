import { Component, Input, } from '@angular/core';

@Component({
  selector: 'equality-filetype-icon',
  templateUrl: './filetype-icon.component.html',
  styleUrls: ['./filetype-icon.component.css']
})
export class FiletypeIconComponent {

  @Input() filename: string;

  getFileName() {
    switch (this.filename.split('.').pop()) {
      case 'pdf':
        return 'icon-' + 'acrobat' + '.svg';
        break;
      case 'xlst':
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'icon-' + 'excel' + '.svg';
        break;
      case 'png':
      case 'jpg':
      case 'gif':
        return 'icon-' + 'image' + '.svg';
        break;
      case 'sav':
        return 'icon-' + 'spss' + '.svg';
        break;
      case 'ppt':
      case 'pptx':
        return 'icon-' + 'powerpoint' + '.svg';
      case 'txt':
        return 'icon-' + 'txt' + '.svg';
      case 'doc':
      case 'docx':
      default:
        return 'icon-' + 'file' + '.svg';
    }
  }
}
