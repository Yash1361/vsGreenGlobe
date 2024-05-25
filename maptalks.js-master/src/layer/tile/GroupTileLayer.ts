/* eslint-disable @typescript-eslint/ban-ts-comment */
import { pushIn } from '../../core/util';
import Layer, { LayerJSONType } from '../Layer';
import TileLayer, { TileLayerOptionsType, TilesType } from './TileLayer';
import Size from '../../geo/Size';

const options: GroupTileLayerOptionsType = {
    urlTemplate: '',
    'maxCacheSize': 1024
};

const DEFAULT_TILESIZE = new Size(256, 256);
const EVENTS = 'show hide remove setzindex forcereloadstart';

function checkLayers(tileLayers: TileLayer[] | TileLayer): TileLayer[] {
    if (!Array.isArray(tileLayers)) {
        tileLayers = [tileLayers];
    }
    return tileLayers;
}

/**
 * @classdesc
 * A layer used to display a group of tile layers. <br>
 * Its performance is better than add TileLayers seperately and it can help prevent limits of active webgl contexts: <br>
 * "WARNING: Too many active WebGL contexts. Oldest context will be lost"
 * @category layer
 * @extends TileLayer
 * @param {String|Number} id - tile layer's id
 * @param {TileLayer[]} layers  - TileLayers to add
 * @param {Object} [options=null] - options defined in [TileLayer]{@link TileLayer#options}
 * @example
 * new GroupTileLayer("group-tiles",[
    new maptalks.WMSTileLayer('wms', {
      'urlTemplate' : 'https://demo.boundlessgeo.com/geoserver/ows',
      'crs' : 'EPSG:3857',
      'layers' : 'ne:ne',
      'styles' : '',
      'version' : '1.3.0',
      'format': 'image/png',
      'transparent' : true,
      'uppercase' : true
    }),
    new maptalks.TileLayer('tile2',{
      urlTemplate: 'http://korona.geog.uni-heidelberg.de/tiles/adminb/x={x}&y={y}&z={z}'
    })
  ])
 */
class GroupTileLayer extends TileLayer {
    layers: TileLayer[];
    layerMap: Record<string, TileLayer>;
    private _groupChildren: any[];
    /**
     * Reproduce a GroupTileLayer from layer's profile JSON.
     * @param layerJSON - layer's profile JSON
     * @return
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON: { [x: string]: any; }): GroupTileLayer {
        if (!layerJSON || layerJSON['type'] !== 'GroupTileLayer') {
            return null;
        }
        const layers = layerJSON['layers'].map(json => Layer.fromJSON(json));
        return new GroupTileLayer(layerJSON['id'], layers, layerJSON['options']);
    }

    /**
     * @param id    - layer's id
     * @param layers  - TileLayers to add
     * @param [options=null]          - construct options
     * @param [options.*=null]             - options defined in [TileLayer]{@link TileLayer#options}
     */
    constructor(id: string, layers: TileLayer[], options?: GroupTileLayerOptionsType) {
        super(id, options);
        this.layers = layers || [];
        this._checkChildren();
        this.layerMap = {};
        this._groupChildren = [];
    }

    /**
     * Get children TileLayer
     */
    getLayers(): TileLayer[] {
        return this.layers;
    }

    /**
     * add tilelayers
     * @param tileLayers
     */
    addLayer(tileLayers: TileLayer[] = []) {
        tileLayers = checkLayers(tileLayers);
        const len = this.layers.length;
        tileLayers.forEach(tileLayer => {
            if (!(tileLayer instanceof TileLayer)) {
                return;
            }
            if (this.layers.indexOf(tileLayer) === -1 && !this.layerMap[tileLayer.getId()]) {
                this.layers.push(tileLayer);
            }
        });
        //layers change
        if (len !== this.layers.length) {
            this._sortLayers();
            this._refresh();
            this._renderLayers();
        }
        return this;
    }

    /**
     * remove tilelayers
     * @param tileLayers
     */
    removeLayer(tileLayers: TileLayer[] = []) {
        tileLayers = checkLayers(tileLayers);
        const len = this.layers.length;
        tileLayers.forEach(tileLayer => {
            if (!(tileLayer instanceof TileLayer)) {
                //if tilelayer is id
                tileLayer = this.layerMap[tileLayer];
            }
            if (!(tileLayer instanceof TileLayer)) {
                return;
            }
            const index = this.layers.indexOf(tileLayer);
            if (index >= 0) {
                this.layers.splice(index, 1);
                tileLayer._doRemove();
                tileLayer.off(EVENTS, this._onLayerShowHide, this);
            }
        });
        //layers change
        if (len !== this.layers.length) {
            this._refresh();
            this._renderLayers();
        }
        return this;
    }

    /**
   * clear tilelayers
   */
    clearLayers() {
        this.layers.forEach(layer => {
            layer._doRemove();
            layer.off(EVENTS, this._onLayerShowHide, this);
        });
        this.layers = [];
        this._refresh();
        this._renderLayers();
        return this;
    }

    /**
     * Export the GroupTileLayer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return layer's profile JSON
     */
    toJSON(): LayerJSONType {
        const profile = {
            'type': this.getJSONType(),
            'id': this.getId(),
            'layers': this.layers.map(layer => layer.toJSON()),
            'options': this.config()
        };
        return profile;
    }

    getTileSize(id: number | string) {
        const layer = this.getLayer(id);
        if (!layer) {
            return DEFAULT_TILESIZE;
        }
        return layer.getTileSize();
    }

    /**
     * Get tiles at zoom (or current zoom)
     * @param z
     * @returns tiles
     */
    getTiles(z: number, parentLayer: any): TilesType {
        const layers = this.layers;
        const tiles = [];
        let count = 0;
        for (let i = 0, l = layers.length; i < l; i++) {
            const layer = layers[i];
            if (!layer || !layer.options['visible'] || !layer.isVisible() || !layer.getMap()) {
                continue;
            }
            const childGrid = layer.getTiles(z, parentLayer || this);
            if (!childGrid || childGrid.count === 0) {
                continue;
            }
            count += childGrid.count;
            pushIn(tiles, childGrid.tileGrids);
        }

        return {
            count: count,
            tileGrids: tiles
        };
    }

    onAdd() {
        this._sortLayers();
        this._refresh();
        super.onAdd();
    }

    onRemove() {
        this.layers.forEach(layer => {
            layer._doRemove();
            layer.off(EVENTS, this._onLayerShowHide, this);
        });
        this.layerMap = {};
        this._groupChildren = [];
        super.onRemove();
    }

    getLayer(id: string | number) {
        return this.getChildLayer(id);
    }

    getChildLayer(id: string | number): TileLayer {
        const layer = this.layerMap[id];
        if (layer) {
            return layer;
        }
        for (let i = 0; i < this._groupChildren.length; i++) {
            const child = this._groupChildren[i].getChildLayer(id);
            if (child) {
                return child;
            }
        }
        return null;
    }

    _removeChildTileCache(layer: TileLayer) {
        if (!layer) {
            return this;
        }
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        let cache: any;
        const id = layer.getId();
        const validateCache = () => {
            return cache && cache.info && cache.info.layer === id;
        };
        //clear LRU
        if (renderer.tileCache) {
            const keys = renderer.tileCache.keys();
            keys.forEach((key: any) => {
                cache = renderer.tileCache.get(key);
                if (validateCache()) {
                    renderer.tileCache.remove(key);
                }
            });
        }
        //clear tilesInView cache
        const tilesInView = renderer.tilesInView || {};
        for (const key in tilesInView) {
            cache = tilesInView[key];
            if (validateCache()) {
                delete tilesInView[key];
            }
        }
        //cancel image load
        const tilesLoading = renderer.tilesLoading || {};
        for (const key in tilesLoading) {
            cache = tilesLoading[key];
            if (validateCache()) {
                renderer.abortTileLoading(cache.image, cache.info);
            }
        }
        return this;
    }

    _onLayerShowHide(e: { type: string; target: any }) {
        const { type, target } = e || {};
        //listen tilelayer.remove() method fix #1629
        if (type === 'remove' && target) {
            this.layers.splice(this.layers.indexOf(target), 1);
            target._doRemove();
            target.off(EVENTS, this._onLayerShowHide, this);
            this._refresh();
        } else if (type === 'setzindex') {
            this._sortLayers();
        } else if (type === 'forcereloadstart') {
            this._removeChildTileCache(target);
        }
        this._renderLayers();
    }

    // render all layers
    _renderLayers() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
        return this;
    }

    // reset layerMap,_groupChildren,listen tilelayers events
    _refresh() {
        const map = this.getMap();
        this._groupChildren = [];
        this.layerMap = {};
        this.layers.forEach(layer => {
            this.layerMap[layer.getId()] = layer;
            // @ts-ignore
            if (layer.getChildLayer) {
                this._groupChildren.push(layer);
            }
            if (!layer.getMap()) {
                layer._bindMap(map);
            }
            //remove old event handler
            layer.off(EVENTS, this._onLayerShowHide, this);
            layer.on(EVENTS, this._onLayerShowHide, this);
        });
        return this;
    }

    isVisible(): boolean {
        if (!super.isVisible()) {
            return false;
        }
        const children = this.layers;
        for (let i = 0, l = children.length; i < l; i++) {
            if (children[i].isVisible()) {
                return true;
            }
        }
        return false;
    }

    _checkChildren() {
        const ids = {};
        this.layers.forEach(layer => {
            const layerId = layer.getId();
            if (ids[layerId]) {
                throw new Error(`Duplicate child layer id (${layerId}) in the GroupTileLayer (${this.getId()})`);
            } else {
                ids[layerId] = 1;
            }
        });
    }

    _sortLayers() {
        this.layers.sort(function (a, b) {
            return a.options.zIndex - b.options.zIndex;
        });
    }
}

GroupTileLayer.registerJSONType('GroupTileLayer');
GroupTileLayer.mergeOptions(options);

export default GroupTileLayer;

export type GroupTileLayerOptionsType = TileLayerOptionsType & {
    maxCacheSize?: number;
}
