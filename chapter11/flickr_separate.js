var flickrSource = new ol.source.Vector();

var cache = {};

/**
 * Returns the style using the photo as an icon.
 * @param {ol.Feature} Feature.
 * @param {number} Scale.
 * @return {ol.style.Style} Style.
 */
function photoStyle(feature, scale) {
  var url = feature.get('url');
  var key = scale + url;
  if (!cache[key]) {
    cache[key] = new ol.style.Style({
      image: new ol.style.Icon({
        scale: scale,
        src: url
      })
    });
  }
  return cache[key];
}

/**
 * Returns style for Flickr.
 * @param {ol.Feature} Feature.
 * @return {Array.<ol.style.Style>} Style.
 */
function flickrStyle(feature) {
  return [photoStyle(feature, 0.10)];
}

/**
 * Returns selected style.
 * @param {ol.Feature} Feature.
 * @return {Array.<ol.style.Style>} Style.
 */
function selectedStyle(feature) {
  return [photoStyle(feature, 0.50)];
}

var flickrLayer = new ol.layer.Vector({
  source: flickrSource,
  style: flickrStyle
});

var layer = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var center = ol.proj.transform([0,0], 'EPSG:4326', 'EPSG:3857');

var view = new ol.View({
  center: center,
  // Removed the trailing comma
  zoom: 2
});

var map = new ol.Map({
  renderer: 'canvas',
  target: 'map',
  layers: [layer, flickrLayer],
  view: view
});

// Not annotated because conflict with jQuery externs
// as the return can be (jQuery|string)
function photoContent(feature) {
  var content = $('#photo-template').html();
  var keys = ['author','author_id','date_taken','latitude','longitude','link','url','tags','title'];
  for (var i=0; i<keys.length; i++) {
    var key = keys[i];
    var value = feature.get(key);
    content = content.replace('{'+key+'}',value);
  }
  return content;
}

var select = new ol.interaction.Select({
  layers: [flickrLayer],
  style: selectedStyle
});

map.addInteraction(select);

var selectedFeatures = select.getFeatures();

selectedFeatures.on('add', function(event) {
  var feature = event.target.item(0);
  var content = photoContent(feature);
  $('#photo-info').html(content);
});

selectedFeatures.on('remove', function(event) {
  $('#photo-info').empty();
});

/**
 * handler when requesting Flickr photos successfully.
 * @param {object} Data.
 */
function successHandler(data) {
  var transform = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
  data.items.forEach(function(item) {
    var feature = new ol.Feature(item);
    // Changed the notation because object['property'] protect from renaming
    feature.set('url', item['media']['m']);
    var coordinate = transform([parseFloat(item.longitude), parseFloat(item.latitude)]);
    var geometry = new ol.geom.Point(coordinate);
    feature.setGeometry(geometry);
    flickrSource.addFeature(feature);
  });
}

/**
 * Make a call to Flickr remote service for photos using tags.
 * @param {string} Tags.
 */
function loadFlickrFeed(tags) {
  selectedFeatures.clear();
  flickrSource.getFeatures().forEach(function(feature) {
    flickrSource.removeFeature(feature);
  });
  $('#photo-info').empty();
  $.ajax({
    'url': 'http://api.flickr.com/services/feeds/geo',
    'data': {
      'format': 'json',
      'tags': tags
    },
    'dataType': 'jsonp',
    'jsonpCallback': 'jsonFlickrFeed',
    'success': successHandler
  });
}

$(document).on('click', '#search button', function() {
  var value = $('#search input').val();
  var tags = value.split(' ').join(',');
  loadFlickrFeed(tags);
});