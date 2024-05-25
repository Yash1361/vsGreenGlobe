import { equalMapView } from '../core/util';
import Map, { MapAnimationOptionsType, MapViewType } from './Map';

declare module "./Map" {
    interface Map {

        zoomToPreviousView(options?: any): MapViewType;
        hasPreviousView(): boolean;
        zoomToNextView(options?: any): MapViewType;
        hasNextView(): boolean;
        getViewHistory(): Array<MapViewType>;
        _onViewChange(view: MapViewType): void;
        _getCurrentView(): MapViewType;


    }
}



Map.include(/** @lends Map.prototype */ {
    _onViewChange(view: MapViewType) {
        if (!this._viewHistory) {
            this._viewHistory = [];
            this._viewHistoryPointer = 0;
        }
        const old = this._getCurrentView();
        for (let i = this._viewHistory.length - 1; i >= 0; i--) {
            if (equalMapView(view, this._viewHistory[i])) {
                this._viewHistoryPointer = i;
                this._fireViewChange(old, view);
                return;
            }
        }

        if (this._viewHistoryPointer < this._viewHistory.length - 1) {
            // remove old 'next views'
            this._viewHistory.splice(this._viewHistoryPointer + 1);
        }
        this._viewHistory.push(view);
        const count = this.options['viewHistoryCount'];
        if (count > 0 && this._viewHistory.length > count) {
            // remove redundant view
            this._viewHistory.splice(0, this._viewHistory.length - count);
        }
        this._viewHistoryPointer = this._viewHistory.length - 1;
        /**
         * viewchange event
         * @event Map#viewchange
         * @type {Object}
         * @property {String} type - viewchange
         * @property {Map} target - map fires the event
         * @property {Object} old - old view
         * @property {Point} new  - new view
         */
        this._fireViewChange(old, view);
    },

    /**
     * Zoom to the previous map view in view history
     * @return {Object} map view
     */
    zoomToPreviousView(options: MapAnimationOptionsType = {}) {
        if (!this.hasPreviousView()) {
            return null;
        }
        const view = this._viewHistory[--this._viewHistoryPointer];
        this._zoomToView(view, options);
        return view;
    },

    /**
     * Whether has more previous view
     * @return {Boolean}
     */
    hasPreviousView() {
        if (!this._viewHistory || this._viewHistoryPointer === 0) {
            return false;
        }
        return true;
    },

    /**
     * Zoom to the next view in view history
     * @return {Object} map view
     */
    zoomToNextView(options: MapAnimationOptionsType = {}) {
        if (!this.hasNextView()) {
            return null;
        }
        const view = this._viewHistory[++this._viewHistoryPointer];
        this._zoomToView(view, options);
        return view;
    },

    /**
     * Whether has more next view
     * @return {Boolean}
     */
    hasNextView(): boolean {
        if (!this._viewHistory || this._viewHistoryPointer === this._viewHistory.length - 1) {
            return false;
        }
        return true;
    },

    _zoomToView(view: MapViewType, options: MapAnimationOptionsType) {
        const old = this.getView();
        if (options['animation']) {
            this._animateTo(view, {
                'duration': options['duration']
            }, frame => {
                if (frame.state.playState === 'finished') {
                    this._fireViewChange(old, view);
                }
            });
        } else {
            this.setView(view);
            this._fireViewChange(old, view);
        }
    },

    /**
     * Get map view history
     * @return {Object[]}
     */
    getViewHistory(): Array<MapViewType> {
        return this._viewHistory;
    },

    _fireViewChange(old: MapViewType, view: MapViewType) {
        this._fireEvent('viewchange', {
            'old': old,
            'new': view
        });
        this._insertUICollidesQueue();
    },

    _getCurrentView(): MapViewType {
        if (!this._viewHistory) {
            return null;
        }
        return this._viewHistory[this._viewHistoryPointer];
    }
});

Map.mergeOptions({
    'viewHistory': true,
    'viewHistoryCount': 10
});
