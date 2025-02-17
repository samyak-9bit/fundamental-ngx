import {
    AfterContentInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    Directive,
    ElementRef,
    HostBinding,
    HostListener,
    Input,
    Optional,
    ViewEncapsulation
} from '@angular/core';
import { IconComponent } from '@fundamental-ngx/core/icon';
import { RtlService } from '@fundamental-ngx/core/utils';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { NestedItemService } from './nested-item/nested-item.service';

let uniqueId = 0;

@Directive({
    selector: '[cxNestedDirectivesHeader], [fdx-nested-list-header]'
})
export class NestedListHeaderDirective {
    /** Id of the element. */
    @Input()
    @HostBinding('attr.id')
    id: string | null = `fdx-nested-list-group-header-${++uniqueId}`;

    /** @hidden */
    @HostBinding('class.fdx-nested-list__group-header')
    cxNestedListHeaderClass = true;

    /** @hidden */
    constructor(private _elementRef: ElementRef) {}

    /** Get the header title */
    get title(): string {
        return this._elementRef.nativeElement.textContent;
    }
}

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: '[cxNestedDirectivesIcon], [fdx-nested-list-icon]',
    template: `<ng-content></ng-content>`
})
export class NestedListIconComponent extends IconComponent {
    /** Role attribute */
    @Input()
    @HostBinding('attr.role')
    role = 'presentation';

    /** @hidden */
    @HostBinding('class.fdx-nested-list__icon')
    fdNestedListIconClass = true;
}

@Directive({
    selector: '[cxNestedDirectivesTitle], [fdx-nested-list-title]'
})
export class NestedListTitleDirective {
    /** @hidden */
    @HostBinding('class.fdx-nested-list__title')
    fdNestedListTitleClass = true;

    /** @hidden */
    constructor(private elementRef: ElementRef) {}

    /** Returns element's InnerText */
    getInnerText(): string {
        return this.elementRef && this.elementRef.nativeElement.textContent;
    }
}

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: '[cxNestedListExpandIcon], [fdx-nested-list-expand-icon]',
    template: ` <ng-content></ng-content> `,
    host: {
        'aria-haspopup': 'true',
        role: 'presentation'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class NestedListExpandIconComponent {
    /** @hidden */
    @HostBinding('class.fdx-nested-list__arrow')
    fdNestedListArrowClass = true;

    /** @hidden */
    @HostBinding('class.sap-icon--navigation-down-arrow')
    get fdNestedListDownArrowClass(): boolean {
        return this.expanded;
    }

    /** @hidden */
    @HostBinding('class.sap-icon--navigation-right-arrow')
    get fdNestedListRightArrowClass(): any {
        return !this.expanded;
    }

    /**
     * @hidden
     * Attribute controlled by the parent `NestedItemComponent`
     */
    @HostBinding('class.is-expanded')
    @HostBinding('attr.aria-expanded')
    expanded = false;

    /** @hidden */
    @HostBinding('attr.aria-hidden')
    ariaHidden = true;

    /** @hidden */
    rtl$: Observable<boolean>;

    /** @hidden */
    constructor(
        private _itemService: NestedItemService,
        private _changeDetRef: ChangeDetectorRef,
        private _elementRef: ElementRef,
        @Optional() private _rtlService: RtlService
    ) {
        this._listenOnTextDirection();
    }

    /** Mouse event handler */
    @HostListener('click', ['$event'])
    onClick(event?: MouseEvent): void {
        this.expanded = !this.expanded;
        this._itemService.toggle.next(this.expanded);
        event?.stopPropagation();
    }

    /** Handler for focus events */
    @HostListener('focus')
    onFocus(): void {
        this._itemService.focus.next();
    }

    /** @hidden */
    changeExpandedState(expanded: boolean): void {
        this.expanded = expanded;
        this._changeDetRef.detectChanges();
    }

    /** @hidden Sets expand arrow depending on text direction */
    private _listenOnTextDirection(): void {
        this.rtl$ = this._rtlService ? this._rtlService.rtl.pipe(map((isRtl) => isRtl)) : of(false);
    }
}

@Directive({
    selector: '[cxNestedDirectivesButton], [fdx-nested-list-button]'
})
export class NestedListButtonDirective implements AfterContentInit {
    /** @hidden */
    @HostBinding('class.fdx-nested-list__button')
    fdNestedListButtonClass = true;

    /** @hidden */
    @ContentChild(NestedListExpandIconComponent)
    _expandIcon: NestedListExpandIconComponent;

    /** @hidden */
    @HostListener('click', ['$event'])
    @HostListener('keydown.enter', ['$event'])
    @HostListener('keydown.space', ['$event'])
    onClick(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this._expandIcon.onClick();
    }

    /** @hidden */
    ngAfterContentInit(): void {
        if (this._expandIcon) {
            this._expandIcon.fdNestedListArrowClass = false;
        }
    }
}
