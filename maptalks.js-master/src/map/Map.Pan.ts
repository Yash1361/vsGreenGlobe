import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import Map, { MapAnimationOptionsType } from './Map';
import { isFunction } from '../core/util';



declare module "./Map" {
    interface Map {

        panTo(coordinate: Coordinate, options?: MapAnimationOptionsType, step?: (frame) => void): this;
        _panTo(prjCoord: Coordinate, options?: MapAnimationOptionsType): this;
        panBy(offset: Point | Array<number>, options?: MapAnimationOptionsType, step?: (frame) => void): this;
        _panAnimation(target: Coordinate, t?: number, cb?: (frame) => void): void;

    }
}


Map.include(/** @lends Map.prototype */ {

    /**
     * Pan to the given coordinate
     * @param {Coordinate} coordinate - coordinate to pan to
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {Map} this
     */
    panTo: function (coordinate, options: MapAnimationOptionsType = {}, step) {
        if (!coordinate) {
            return this;
        }
        if (isFunction(options)) {
            step = options;
            options = {};
        }
        coordinate = new Coordinate(coordinate);
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            const prjCoord = this.getProjection().project(coordinate);
            return this._panAnimation(prjCoord, options['duration'], step);
        } else {
            this.setCenter(coordinate);
        }
        return this;
    },

    _panTo: function (prjCoord, options: MapAnimationOptionsType = {}) {
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            return this._panAnimation(prjCoord, options['duration']);
        } else {
            this.onMoveStart();
            this._setPrjCenter(prjCoord);
            this.onMoveEnd(this._parseEventFromCoord(this.getCenter()));
            return this;
        }
    },

    /**
     * Pan the map by the give point
     * @param  {Point} point - distance to pan, in pixel
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {Map} this
     */
    panBy: function (offset, options: MapAnimationOptionsType = {}, step?: (frame) => void) {
        if (!offset) {
            return this;
        }
        if (isFunction(options)) {
            step = (options as (frame) => void);
            options = {};
        }
        offset = new Point(offset);
        const containerExtent = this.getContainerExtent();
        const ymin = containerExtent.ymin;
        if (ymin > 0 && offset.y > 30) {
            //limit offset'y when tilted to max pitch
            const y = offset.y;
            offset.y = 30;
            offset.x = offset.x * 30 / y;
            console.warn('offset is limited to panBy when pitch is above maxPitch');
            // return this;
        }
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            offset = offset.multi(-1);
            // const point0 = this._prjToPoint(this._getPrjCenter());
            // const point1 =
            // point._add(offset.x, offset.y);
            // const target = this._pointToPrj(point);
            const target = this._containerPointToPrj(new Point(this.width / 2 + offset.x, this.height / 2 + offset.y));
            // const target = this.locateByPoint(this.getCenter(), offset.x, offset.y);
            this._panAnimation(target, options['duration'], step);
        } else {
            this.onMoveStart();
            this._offsetCenterByPixel(offset);
            const endCoord = this.containerPointToCoord(new Point(this.width / 2, this.height / 2));
            this.onMoveEnd(this._parseEventFromCoord(endCoord));
        }
        return this;
    },

    _panAnimation: function (target: Coordinate, t: number, cb: (frame) => void) {
        return this._animateTo({
            'prjCenter': target
        }, {
            'duration': t || this.options['panAnimationDuration'],
        }, cb);
    }
});
