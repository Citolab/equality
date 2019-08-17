import { Component, OnInit, Input, } from '@angular/core';

@Component({
  selector: 'app-filetype-icon',
  templateUrl: './filetype-icon.component.html',
  styleUrls: ['./filetype-icon.component.css']
})
export class FiletypeIconComponent implements OnInit {

  @Input() filename: string;

  constructor() { }

  ngOnInit() {
  }

  getFileName() {
    switch (this.filename.split('.').pop()) {
      case 'pdf':
        return 'icon-' + 'acrobat' + '.svg';
        break;
      case 'xlst':
      case 'xls':
      case 'csv':
        return 'icon-' + 'excel' + '.svg';
        break;
      case 'png':
      case 'jpg':
      case 'gif':
        return 'icon-' + 'image' + '.svg';
        break;
      case 'pptx':
      case 'ppt':
      case 'pptx':
        return 'icon-' + 'powerpoint' + '.svg';
        break;
      case 'txt':
        return 'icon-' + 'txt' + '.svg';
        break;
      case 'doc':
      case 'docx':
      case 'gif':
        return 'icon-' + 'word' + '.svg';
        break;
      default:
        return 'icon-' + 'file' + '.svg';
    }
  }
}
