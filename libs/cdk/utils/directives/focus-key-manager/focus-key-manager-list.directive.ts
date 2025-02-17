import { FocusableOption, FocusKeyManager } from '@angular/cdk/a11y';
import {
    AfterContentInit,
    ChangeDetectorRef,
    ContentChildren,
    Directive,
    Input,
    OnChanges,
    OnDestroy,
    Optional,
    QueryList,
    SimpleChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { RtlService } from '../../services/rtl.service';
import { FOCUSABLE_ITEM } from './focus-key-manager.tokens';

/** Directive to apply Angular Material FocusKeyManager to lists.
 * To be used with FocusKeyManagerItemDirective
 */
@Directive({
    selector: `[fdkFocusKeyManagerList]`,
    standalone: true
})
export class FocusKeyManagerListDirective<TItem extends FocusableOption = Record<any, any> & FocusableOption>
    implements OnChanges, AfterContentInit, OnDestroy
{
    /** Orientation for the FocusKeyManager */
    @Input()
    orientation: 'horizontal' | 'vertical';

    /** Skip predicate for the FocusKeyManager */
    @Input()
    skipPredicate: (item: TItem) => boolean;

    /** @hidden */
    @ContentChildren(FOCUSABLE_ITEM)
    readonly _items: QueryList<TItem>;

    /** @hidden */
    get focusKeyManager(): FocusKeyManager<TItem> {
        return this._focusKeyManager;
    }

    /** @hidden */
    private _focusKeyManager: FocusKeyManager<TItem>;

    /** @hidden */
    private readonly _onDestroy$ = new Subject<void>();

    /** @hidden */
    constructor(
        @Optional() private readonly _rtlService: RtlService,
        private readonly _cdr: ChangeDetectorRef
    ) {}

    /** @hidden */
    ngOnChanges(changes: SimpleChanges): void {
        if (!this._focusKeyManager) {
            return;
        }

        if ('orientation' in changes) {
            this._applyOrientation();
        }

        if ('skiPredicate' in changes) {
            this._focusKeyManager.skipPredicate(this.skipPredicate);
        }
    }

    /** @hidden */
    ngAfterContentInit(): void {
        this._focusKeyManager = new FocusKeyManager<TItem>(this._items).skipPredicate(this.skipPredicate);

        this._applyOrientation();

        this._cdr.detectChanges();

        this._rtlService?.rtl
            .pipe(
                filter(() => this.orientation === 'horizontal'),
                takeUntil(this._onDestroy$)
            )
            .subscribe(() => this._applyOrientation());
    }

    /** @hidden */
    ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
        this._focusKeyManager.destroy();
    }

    /** Focus certain list's item */
    focusItem(item: number | TItem): any {
        if (typeof item === 'number') {
            this._focusKeyManager.setActiveItem(item);
        } else {
            this._focusKeyManager.setActiveItem(item);
        }
    }

    /** @hidden */
    private _applyOrientation(): void {
        switch (this.orientation) {
            case 'horizontal':
                this._focusKeyManager.withHorizontalOrientation(this._rtlService?.rtl.value ? 'rtl' : 'ltr');
                break;
            case 'vertical':
                this._focusKeyManager.withVerticalOrientation(true);
                break;
        }
    }
}
