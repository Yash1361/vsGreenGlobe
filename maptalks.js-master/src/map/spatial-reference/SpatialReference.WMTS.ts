import { isString } from '../../core/util';
import Ajax from '../../core/Ajax';

function getProjectionCode(code) {
    let newcode = '';
    const codeArray = code.split('');
    for (let len = codeArray.length, i = len - 1; i >= 0; i--) {
        if (!isNaN(codeArray[i])) {
            newcode = codeArray[i] + newcode;
        } else {
            break;
        }
    }
    return newcode;
}

function getProjection(projection) {
    let prj = (projection.indexOf('EPSG') > -1 ? projection : 'EPSG:' + projection);
    prj = strReplace(prj, [
        ['4490', '4326'],
        ['102100', '3857'],
        ['900913', '3857']
    ]);
    return prj;
}

function strReplace(str, repArray = []) {
    repArray.forEach(rep => {
        const [template, value] = rep;
        str = str.replace(template, value);
    });
    return str;
}

function getTransformValue(options) {
    const { projection, isArcgis, isGeoServer, isSuperMap } = options;
    //transform value, ArcGIS is different from others
    let transformValue = 0.0002645833333333333;
    if (isArcgis || isGeoServer || isSuperMap) {
        transformValue = 0.00028;
    }
    if (projection && projection.indexOf('4326') > -1) {
        transformValue = 2.3767925226029154e-9;
        if (isArcgis || isSuperMap) {
            transformValue = 2.518101729011901e-9;
        }
        if (isGeoServer) {
            transformValue = 2.51528279553466e-9;
        }
    }
    return transformValue;
}

const ns = 'wmts';

// try get by localName, ns:localName
function getElementsByTagName(element, localName) {
    const result = element.getElementsByTagName(localName);
    if (result && result.length) {
        return result;
    }
    const name = ns + ':' + localName;
    return element.getElementsByTagName(name);
}

function getTileMatrixSet(TileMatrixSets, TileMatrixSetLink) {
    for (let i = 0; i < TileMatrixSets.length; i++) {
        let TileMatrixSet = TileMatrixSets[i];
        TileMatrixSet = TileMatrixSet.getElementsByTagName('ows:Identifier')[0];
        if (TileMatrixSet) {
            if (TileMatrixSet.textContent === TileMatrixSetLink) {
                return TileMatrixSets[i];
            }
        }
    }
    return null;
}

function parseWMTSXML(str, requestUrl, options) {
    const serviceType = ["isArcgis", "isSuperMap", "isGeoServer"];
    if (serviceType.every((key) => options[key] == null)) {
        console.warn(
            "Please specify the server type, such as isArcgis, isSuperMap, isGeoServer, Otherwise, the system will determine by itself"
        );
    }
    //IE test success
    if (options.isArcgis == null) {
        options.isArcgis = ["arcgis", "geoscene"].some(
            (key) => str.indexOf(key) > -1
        );
    }
    if (options.isSuperMap == null) {
        options.isSuperMap = str.indexOf('supermap') > -1;
    }
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(str, 'text/xml');
    const content = xmlDoc.querySelectorAll('Contents')[0];
    if (!content) {
        return [];
    }
    const layers = getElementsByTagName(content, 'Layer');
    if (!layers.length) {
        return [];
    }
    const TileMatrixSets = [];
    for (let i = 0, len = content.childNodes.length; i < len; i++) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (content.childNodes[i].localName === 'TileMatrixSet') {
            TileMatrixSets.push(content.childNodes[i]);
        }
    }
    if (!TileMatrixSets.length) {
        return [];
    }
    const result = [];
    for (let i = 0, len = layers.length; i < len; i++) {
        const layer = layers[i];
        let style = layer.querySelectorAll('Style')[0];
        if (style) {
            style = style.getElementsByTagName('ows:Identifier')[0];
            if (style) {
                style = style.textContent;
            }
        }
        let layerName = layer.getElementsByTagName('ows:Identifier')[0];
        if (layerName) {
            layerName = layerName.textContent;
        }
        const tileMatrixSetLinks = getElementsByTagName(layer, 'TileMatrixSetLink');
        if (tileMatrixSetLinks.length === 0) {
            continue;
        }
        for (let j = 0, len1 = tileMatrixSetLinks.length; j < len1; j++) {
            let tileMatrixSetLink = tileMatrixSetLinks[j];
            tileMatrixSetLink = getElementsByTagName(tileMatrixSetLink, 'TileMatrixSet')[0];
            if (tileMatrixSetLink) {
                tileMatrixSetLink = tileMatrixSetLink.textContent;
            }
            const tileMatrixSet = getTileMatrixSet(TileMatrixSets, tileMatrixSetLink);
            if (!tileMatrixSet) {
                continue;
            }
            const resourceURL = layer.querySelectorAll('ResourceURL')[0];
            let url = '';
            if (resourceURL) {
                url = resourceURL.attributes.template.value;
            }
            const { resolutions, tileSize, tileSystem, projection, TileMatrixSet, isGeoServer, levelStr } = parseTileMatrixSet(tileMatrixSet, options);
            //not find ServerURL
            if (!url.length) {
                url = requestUrl.substr(0, requestUrl.lastIndexOf('?'));
                url += '?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER={LAYER}&STYLE={Style}&TILEMATRIXSET={TileMatrixSet}&FORMAT={tiles}&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}';
            }
            const urlTemplate = strReplace(url, [
                ['{LAYER}', layerName],
                ['{Layer}', layerName],
                ['{layer}', layerName],
                ['{STYLE}', style],
                ['{Style}', style],
                ['{style}', style],
                ['{TileMatrixSet}', TileMatrixSet],
                ['{TileMatrix}', isGeoServer ? `${levelStr}:{z}` : '{z}'],
                ['{TileRow}', '{y}'],
                ['{TileCol}', '{x}'],
                ['{tiles}', isGeoServer ? 'image/png' : 'tiles'],
            ]);
            result.push({
                tileSize,
                tileSystem,
                spatialReference: {
                    resolutions,
                    projection
                },
                urlTemplate,
                info: {
                    layerName, TileMatrixSet, style, tileSize, tileSystem, resolutions, projection, urlTemplate
                }
            });
        }

    }
    return result;
}

function parseTileMatrixSet(TileMatrixSet, options: any = {}) {
    const TileMatrixs = getElementsByTagName(TileMatrixSet, 'TileMatrix');
    const resolutions = [], tileSystem = [], tileSize = [];
    let projection, tset, isGeoServer = false, levelStr;
    if (!projection) {
        const supportedCRS = TileMatrixSet.getElementsByTagName('ows:SupportedCRS')[0];
        if (supportedCRS) {
            projection = supportedCRS.textContent;
            projection = projection.split('EPSG')[1];
            projection = getProjectionCode(projection);
            projection = getProjection(projection);
        }
    }
    if (!tset) {
        tset = TileMatrixSet.getElementsByTagName('ows:Identifier')[0];
        if (tset) {
            tset = tset.textContent;
        }
    }
    options.projection = projection;
    let minLevel = Infinity;
    for (let index = 0; index < TileMatrixs.length; index++) {
        const TileMatrix = TileMatrixs[index];
        let level = TileMatrix.getElementsByTagName('ows:Identifier')[0].textContent;
        if (isNaN(parseInt(level))) {
            levelStr = level.substr(0, level.lastIndexOf(':'));
            level = level.split(':');
            level = level[level.length - 1];
            level = parseInt(level);
            isGeoServer = true;
            options.isGeoServer = true;
        } else {
            level = parseInt(level);
        }
        minLevel = Math.min(minLevel, level);
        const ScaleDenominator = getElementsByTagName(TileMatrix, 'ScaleDenominator')[0].textContent;
        const TopLeftCorner = getElementsByTagName(TileMatrix, 'TopLeftCorner')[0].textContent;
        const TileWidth = getElementsByTagName(TileMatrix, 'TileWidth')[0].textContent;
        const TileHeight = getElementsByTagName(TileMatrix, 'TileHeight')[0].textContent;
        if (tileSize.length === 0) {
            tileSize.push(parseInt(TileWidth), parseInt(TileHeight));
        }
        if (tileSystem.length === 0) {
            const [x, y] = TopLeftCorner.split(' ').filter(s => {
                return s !== '';
            }).map(v => {
                return parseFloat(v);
            });
            if (x > 0) {
                tileSystem.push(1, -1, y, x);
            } else {
                tileSystem.push(1, -1, x, y);
            }
        }
        const transformValue = getTransformValue(options);
        const res = parseFloat(ScaleDenominator) * transformValue;
        resolutions.push(res);
    }
    //Missing LOD completion
    // such as http://t0.tianditu.gov.cn/img_w/wmts?request=GetCapabilities&service=wmts&tk=de0dc270a51aaca3dd4e64d4f8c81ff6
    if (minLevel > 0) {
        let res = resolutions[0];
        for (let i = minLevel - 1; i >= 0; i--) {
            res = res * 2;
            resolutions.splice(0, 0, res);
        }
    }
    return {
        resolutions, tileSize, tileSystem, projection, TileMatrixSet: tset, isGeoServer, levelStr
    };
}

export const loadWMTS = (url: string, cb: (_, layers?) => void, options = { 'jsonp': true }) => {
    if (isString(url)) {
        Ajax.get(url, (err, xml) => {
            if (err) {
                cb(err);
                return;
            }
            const layers = parseWMTSXML(xml, url, options);
            cb(null, layers);
        }, options);
    }
    // return this;
};

export default loadWMTS;
