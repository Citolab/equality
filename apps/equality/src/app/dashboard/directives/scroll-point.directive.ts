import { Directive, Input, Inject, Renderer2, ElementRef, HostListener, NgModule, OnInit } from '@angular/core';

import { DOCUMENT } from '@angular/common';

@Directive({
    selector: '[equalityScrollPoint]'
})
export class ScrollPointDirective implements OnInit {
    @Input() scrollPoint: number;
    // tslint:disable-next-line:variable-name
    _scrollPoint: number;
    constructor(
        @Inject(DOCUMENT) private document: Document,
        private renderer: Renderer2,
        private el: ElementRef
    ) { }

    ngOnInit() {
        this._scrollPoint = this.scrollPoint;
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        const windowScroll = window.scrollY;
        if (windowScroll > this._scrollPoint) {
            // add class to the native element
            this.renderer.addClass(this.el.nativeElement, 'sticky-nav');
        } else {
            // remove class from native element
            this.renderer.removeClass(this.el.nativeElement, 'sticky-nav');
        }
    }
}

@NgModule({
    declarations: [
        ScrollPointDirective
    ],
    exports: [
        ScrollPointDirective
    ]
})
export class ScrollPointModule { }
