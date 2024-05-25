var map = new maptalks.Map('map', {
    center: [15.2663, -4.4419], // Coordinates for Kinshasa
    zoom: 14,
    minZoom: 14, // Minimum zoom level
    centerCross: true,
    baseLayer: new maptalks.TileLayer('base', {
      urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdomains: ["a", "b", "c", "d"],
      attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
    }),
    layers: [
      new maptalks.VectorLayer('v')
    ]
  });
  
  var extent = map.getExtent();
  map.setMaxExtent(extent);
  
  map.setZoom(map.getZoom() - 2, { animation: false });
  
  map.getLayer('v').addGeometry(
    new maptalks.Polygon(extent.toArray(), {
      symbol: { 'polygonOpacity': 0, 'lineWidth': 5 }
    })
  );
  
  // Allow zooming in but not zooming out
  map.setMinZoom(14);
  