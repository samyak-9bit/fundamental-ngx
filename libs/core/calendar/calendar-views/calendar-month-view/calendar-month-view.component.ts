import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DATE_TIME_FORMATS, DateTimeFormats, DatetimeAdapter } from '@fundamental-ngx/core/datetime';

import { ButtonComponent } from '@fundamental-ngx/core/button';
import { FdTranslatePipe } from '@fundamental-ngx/i18n';
import { CalendarService } from '../../calendar.service';
import { CalendarMonth } from '../../models/calendar-month';
import { DefaultCalendarActiveCellStrategy, EscapeFocusFunction, FocusableCalendarView } from '../../models/common';

/** Component representing the month view of the calendar. */
@Component({
    selector: 'fd-calendar-month-view',
    templateUrl: './calendar-month-view.component.html',
    styleUrl: './calendar-month-view.component.scss',
    encapsulation: ViewEncapsulation.None,
    host: {
        '[attr.id]': 'viewId'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ButtonComponent, FdTranslatePipe]
})
export class CalendarMonthViewComponent<D> implements OnInit, OnDestroy, OnChanges, FocusableCalendarView {
    /** The id of the calendar passed from the parent component */
    @Input()
    id: string;

    /** A number (1-12) representing the selected month */
    @Input()
    monthSelected: number;

    /** A function that handles escape focus */
    @Input()
    focusEscapeFunction: EscapeFocusFunction;

    /** A year the month view is referring to */
    @Input()
    year: number;

    /** An event fired when a new month is selected */
    @Output()
    readonly monthClicked: EventEmitter<number> = new EventEmitter<number>();

    /**
     * @hidden
     * Month grid table
     */
    _calendarMonthListGrid: CalendarMonth[][];

    /**
     * @hidden
     * A number offset used to achieve the 1-12 representation of the calendar
     */
    private readonly _monthOffset: number = 1;
    /** @hidden */
    private readonly _amountOfColPerRow: number = 3;
    /** @hidden */
    private readonly _amountOfRows: number = 4;

    /**
     * @hidden
     * An RxJS Subject that will kill the data stream upon component’s destruction (for unsubscribing)
     */
    private readonly _onDestroy$: Subject<void> = new Subject<void>();

    /** @hidden */
    private _initiated = false;

    /** @hidden */
    constructor(
        private _eRef: ElementRef,
        private _changeDetectorRef: ChangeDetectorRef,
        private _calendarService: CalendarService,
        @Inject(DATE_TIME_FORMATS) private _dateTimeFormats: DateTimeFormats,
        private _dateTimeAdapter: DatetimeAdapter<D>
    ) {}

    /** @hidden */
    ngOnInit(): void {
        this._initiated = true;
        this._setupKeyboardService();
        this._constructMonthGrid();

        this._dateTimeAdapter.localeChanges.pipe(takeUntil(this._onDestroy$)).subscribe(() => {
            this._constructMonthGrid();
            this._changeDetectorRef.markForCheck();
        });
    }

    /** @hidden */
    ngOnChanges(changes: SimpleChanges): void {
        if (this._initiated && ('monthSelected' in changes || 'year' in changes || 'id' in changes)) {
            this._constructMonthGrid();
        }
    }

    /** @hidden */
    ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    /** Get a number (1-12) representing the current month  */
    get currentMonth(): number {
        return this._dateTimeAdapter.getMonth(this._dateTimeAdapter.today());
    }

    /**  Getter for the private class member _monthOffset */
    get monthOffset(): number {
        return this._monthOffset;
    }

    /** View ID */
    get viewId(): string {
        return this.id + '-month-view';
    }

    /**
     * @hidden
     * Today cell label ID
     */
    get _todayLabelId(): string {
        return this.viewId + '-today-label';
    }

    /**
     * @hidden
     * Selected date label ID
     */
    get _selectedDateLabelId(): string {
        return this.viewId + '-selected-date-label';
    }

    /** Method for handling the mouse click event when a month is selected  */
    selectMonth(monthCell: CalendarMonth, event?: MouseEvent): void {
        if (event) {
            event.stopPropagation();
        }
        this.monthSelected = monthCell.month;
        this.monthClicked.emit(this.monthSelected);
    }

    /**
     * Set focus on month cell.
     * It can be a selected cell, current month cell or first cell in the list
     */
    setFocusOnCell(): void {
        const cellToFocus = new DefaultCalendarActiveCellStrategy().getActiveCell(this._getMonthList());
        if (!cellToFocus?.id) {
            return;
        }
        this._focusElementBySelector(`#${cellToFocus.id}`);
    }

    /**
     * @hidden
     * Method for handling the keyboard events (a11y)
     */
    _onKeydownMonthHandler(event: KeyboardEvent, index: number): void {
        this._calendarService.onKeydownHandler(event, index);
    }

    /**
     * @hidden
     * Method that allows to focus elements inside this component
     */
    _focusElementBySelector(elementSelector: string): void {
        const elementToFocus: HTMLElement = this._eRef.nativeElement.querySelector(elementSelector);
        if (elementToFocus?.focus) {
            elementToFocus.focus();
        }
    }

    /**
     * @hidden
     * Method returning id of month cell
     */
    _getIndex(rowIndex: number, colIndex: number): number {
        return this._calendarService.getId(rowIndex, colIndex);
    }

    /**
     * @hidden
     * @param index month grid cell index
     */
    _getId(index: number): string {
        return this.viewId + '-month-' + index;
    }

    /**
     * @hidden
     * Method that checks if this is current month
     */
    _isCurrent(id: number): boolean {
        return id + this._monthOffset === this.currentMonth;
    }

    /**
     * @hidden
     * Method that check if this is selected month
     */
    _isSelected(id: number): boolean {
        return id + this._monthOffset === this.monthSelected;
    }

    /**
     * @hidden
     * Method that create month grid with required meta data
     */
    private _constructMonthGrid(): void {
        const monthNames: string[] = this._dateTimeAdapter.getMonthNames('short');

        const monthList: CalendarMonth[] = monthNames.map((monthName, index): CalendarMonth => {
            const month = index + this.monthOffset;
            return {
                month,
                label: monthName,
                ariaLabel: this._dateTimeAdapter.format(
                    this._dateTimeAdapter.createDate(this.year, month, 1),
                    this._dateTimeFormats.display.monthA11yLabel
                ),
                index,
                selected: month === this.monthSelected,
                current: month === this.currentMonth,
                tabIndex: month === this.monthSelected ? 0 : -1
            };
        });

        this._calendarMonthListGrid = [];
        /** Creating 2d grid */
        while (monthList.length) {
            this._calendarMonthListGrid.push(monthList.splice(0, this._amountOfColPerRow));
        }

        this._calendarMonthListGrid.forEach((row, rowIndex) => {
            row.forEach((monthCell, colIndex) => {
                monthCell.id = this._getId(this._getIndex(rowIndex, colIndex));
            });
        });

        this._changeDetectorRef.markForCheck();
    }

    /**
     * @hidden
     * Method to put configuration and listeners on calendar keyboard service
     */
    private _setupKeyboardService(): void {
        this._calendarService.rowAmount = this._amountOfRows;
        this._calendarService.colAmount = this._amountOfColPerRow;
        this._calendarService.focusEscapeFunction = this.focusEscapeFunction;

        this._calendarService.onFocusIdChange
            .pipe(takeUntil(this._onDestroy$))
            .subscribe((index) => this._focusOnCellByIndex(index));

        this._calendarService.onKeySelect
            .pipe(takeUntil(this._onDestroy$))
            .subscribe((index) => this.selectMonth(this._getMonthList()[index]));
    }

    /**
     * @hidden
     * Returns transformed 1d array from 2d month grid.
     */
    private _getMonthList(): CalendarMonth[] {
        return (<CalendarMonth[]>[]).concat(...this._calendarMonthListGrid);
    }

    /** @hidden */
    private _focusOnCellByIndex(index: number): void {
        this._focusElementBySelector(`#${this._getId(index)}`);
    }
}
