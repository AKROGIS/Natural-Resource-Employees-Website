var lyrLoaded = false;
var map;
//var lyr;
//var features;
var currentResource = null;
var currentField = null;
var currentFunction = null;
//var selectionSymbol;
//var closetimer;
var staff;
var font;
var resourceTotalByUnit = null;
var personnelData = null;
var locations = {};

dojo.addOnLoad(init);

function init() {
    esri.config.defaults.io.proxyUrl = "proxy.ashx";
    font = new esri.symbol.Font(markerTextSize, esri.symbol.Font.STYLE_NORMAL, esri.symbol.Font.VARIANT_NORMAL, esri.symbol.Font.WEIGHT_NORMAL, "Arial");
	require(["esri/map", "dojo/domReady!"], function(Map) {
		map = new Map("map", {
			basemap: "topo",
			center: [-150,65], // long, lat
			zoom: 5,
			slider: false,
			nav: false,
			logo: false,
			wrapAround180: true
		});
		map.on("load", initMap);

		function initMap() {
			var template = new esri.InfoTemplate();
			template.setTitle(infoTitle);
			template.setContent(infoContent);
			map.graphics.setInfoTemplate(template);
			//dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
			//dojo.connect(map, "onUpdateEnd", layersUpdateEnd);
			//dojo.connect(map, "onExtentChange", mapExtentChange);
			getStaffData();
			drawStaffCircles();
		};
    });
}

/*/
    var info = esri.arcgis.utils.createMap(config.webmap, "map", {
        mapOptions: {
            slider: false,
            nav: false,
            logo: false,
			wrapAround180: true
        },
        //ignorePopups: true
    });
    info.addCallback(function (response) {
        map = response.map;
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
        dojo.connect(map, "onUpdateEnd", layersUpdateEnd);
        dojo.connect(map, "onExtentChange", mapExtentChange);
		
        var layers = response.itemInfo.itemData.operationalLayers;
        if (map.loaded) {
            initMap(layers)
        } else {
            dojo.connect(map, "onLoad", function () {
                initMap(layers)
            })
        }
    
	});
    info.addErrback(function (response) {
        console.log("Map creation failed: ", dojo.toJson(response))
    })
	
}

function initMap(layers) {
	dojo.forEach(layers,function(layer){
        if (layer.title == config.lyr) {
            lyr = layer.featureCollection.layers[0].layerObject;
			var template = new esri.InfoTemplate();
			template.setTitle(infoTitle);
			template.setContent(infoContent);
			map.graphics.setInfoTemplate(template);
        }
	});
}
*/

function infoTitle(graphic) {
	return unitShortNameLookup[graphic.attributes.unit];
}

function getPersonnelData() {
	//TODO: Can we restructure to be more efficient.
	return personJSON;
}

function getUnitLocations() {
	if (unitLocationLookup != null) {
		for (var unit in unitLocationLookup) {
			latLongPair = unitLocationLookup[unit];
			var geom = new esri.geometry.Point(latLongPair);
			locations[unit] = geom;
		}
	}
}

function infoContent(graphic) {
	var a = graphic.attributes;
	if (personnelData == null) {
		personnelData = getPersonnelData();
	}
	var f = filter(personnelData, a.unit, a.resource, a.field, a.func);
	var t = "";
	if	(f == null) {
		t += "<span class='popup_error'>Unable to show this list.  Please try another Unit or Category.</span>";
	} else {
		f = mergeFteByPerson(f);
		//f.sort(comparePersonFTE);
		t += "<table class='popup_table'><tbody>";
		for (var i=0; i < f.length; i++) {
			fte = Math.round(f[i].Person_FTE*100)/100;
			t += "<tr>";
			t += "<td class='popup_name'>" + f[i].Person + "</td>";
			t += "<td class='popup_network'>" + f[i].Network + "</td>";
			t += "<td class='popup_percent'>" + fte + "</td>";
			t += "<tr>";
		}
		t += "</tbody></table>";
	}	
	return t;
}

function filter(data, unit, res, field, func) {
	var filtered = null;
	if (unit == null)
		return filtered;
	if (field != null && func != null) {
		filtered = dojo.filter(data, function(item, idx){
			return item.Field == field && item.Function == func && item.Unit == unit;
		});
	} else if (field != null) {
		filtered = dojo.filter(data, function(item, idx){
			return item.Field == field && item.Unit == unit;
		});
	} else if  (res != null) {
		filtered = dojo.filter(data, function(item, idx){
			return item.Resource == res && item.Unit == unit;
		});
	} else {
		filtered = dojo.filter(data, function(item, idx){
			return item.Unit == unit;
		});
	}
	return filtered;
}

function mergeFteByPerson(unitStaff) {
	emps = {};
	for (var i = unitStaff.length - 1; i >= 0; i--) {
		individual = unitStaff[i];
		if (individual.Person in emps) {
			emps[individual.Person].Person_FTE +=	individual.Person_FTE
		} else {
			//make a copy, otherwise each popup will be additive
			emps[individual.Person] =	{"Person":individual.Person, "Network":individual.Network,"Person_FTE":individual.Person_FTE} ;
		};
	};
	//return as a list of staff
	var list = [];
	for (var individual in emps) {
		list.push(emps[individual]);
	}
	list.sort(comparePersonLastName)
	return list;
}

function mapExtentChange() {}

function togglePanel(panel) {
    if (panel != currentPanel) {
        var oldPanel = dojo.byId(currentPanel);
        var newPanel = dojo.byId(panel);
        var closeAction = animatePanel(oldPanel, panelBounceTime, panelWidthOpen, panelWidthClosed, panelEasing);
        var openAction = animatePanel(newPanel, panelBounceTime, panelWidthClosed, panelWidthOpen, panelEasing);
        dojo.fx.combine([closeAction, openAction]).play();
        currentPanel = panel;
    }
	var index = dojo.lastIndexOf(panels, currentPanel);
	var category = categories[index];
	if (category == 'All Resources') {
		selectRegion()
	} else {
		selectField(category)
	}
}

function animatePanel(a, b, d, g, e) {
    var c = dojo.animateProperty({
        node: a,
        duration: b,
        easing: dojo.fx.easing[e],
        properties: {
            width: {
                end: g,
                start: d
            }
        }
    });
    return c
}

/*
function layersUpdateEnd() {
    if (lyrLoaded == false) {
        //features = lyr.graphics.slice();
        lyrLoaded = true;
        drawStaffCircles();
        map.setLevel(5);
    }
}
*/
function lyrClick(a) {
    //var b = a.graphic;
    //var d = "http://london2012.com" + b.attributes.LINK;
    //window.open(d)
}

function doMapZoom(zoomInc) {
    var newZoom = map.getLevel() + zoomInc;
    map.setLevel(newZoom);
}

function resourceList() {
	//returns the staff record for the last field/function/unit for each resource
	var resources = {};
	var firstResource = null;
	for (var i = 0; i < staff.length; i++) {
		var item = staff[i];
		resources[item.Resource] = item;
	}
	//return as a list of staff items
	var list = [];
	for (var resource in resources) {
		list.push(resources[resource]);
	}
	return list;
}

function getResourceTotalByUnit() {
	//Creates a list of objects each with a Unit and Total property
	//Total is the sum of all Unit_FTEs across all Resource categories
	var items = {};
	for (var i = 0; i < staff.length; i++) {
		var item = staff[i];
		if (item.Unit in items) {
			items[item.Unit][item.Resource] = item.Unit_FTE
		} else {
			items[item.Unit] = {};
		}
	}
	var list = []
	for (var unit in items) {
		var total = 0;
		for (var resource in items[unit]) {
			total += parseFloat(items[unit][resource]);
		}
		total = Math.round(total*100)/100;
		list.push({'Unit': unit, 'Total': total.toString()});
	}
	return list;
}

function getStaffData() {
    staff = staffJSON;
	//Primary Resourses (category 0)
	//get the item for the first field/function/unit for each resourse
	filtered = resourceList()
	filtered.sort(compareResourceFTE);
	var html = ""
	for (var j = 0; j < filtered.length; j++) {
		var c = filtered[j];
		var f = c.Resource;
		var h = c.FTE;
		html += "<a href='javascript:void(0)' onclick='selectResource(\"" + f +"\");'>" + f + "&nbsp<span class='txtNum'>" + h + "</span></a><br>"
	};
	var blk = dojo.byId(blocks[0]);
	if (blk != null) blk.innerHTML = html;
	
	for (var i = 1; i < categories.length; i++) {
		var filtered = dojo.filter(staff, function(item, idx){
			return item.Field == categories[i] && item.Unit == 'akro';
		});
		filtered.sort(compareFunctionFTE);
		var html = ""
		for (var j = 0; j < filtered.length; j++) {
			var c = filtered[j];
			var f = c.Function;
			var h = c.Function_FTE;
			html += "<a href='javascript:void(0)' onclick='selectFunction(\"" + f +"\");'>" + f + "&nbsp<span class='txtNum'>" + h + "</span></a><br>"
		};
		var blk = dojo.byId(blocks[i]);
		if (blk != null) blk.innerHTML = html;
	}
	resourceTotalByUnit = getResourceTotalByUnit();
	getUnitLocations();
}

function selectRegion() {
	currentResource = null
	currentField = null
	currentFunction = null
	drawStaffCircles();
}

function selectResource(resource) {
	currentResource = resource
	currentField = null
	currentFunction = null
	drawStaffCircles();
}

function selectField(field) {
	currentResource = null
	currentField = field
	currentFunction = null
	drawStaffCircles();
}

function selectFunction(functn) {
	currentResource = null
	currentField = null
	currentFunction = functn
	drawStaffCircles();
}

function updateLabel(category, color, total) {
	var label = dojo.byId("selectionLabel");
	if (label != null) {
		label.style["background-color"] = color;
		var text;
		if (currentFunction == null) {
			if (currentResource == null) {
				text = category;
			} else {
				text = "All " + currentResource;
			}
		} else {
			text = category + " - " + currentFunction;
		}
		label.innerHTML = text + "&nbsp<span class='labelNum'>" + total + "</span>"
	}
}

function drawStaffCircles() {
    map.infoWindow.hide();
    map.graphics.clear();
	var index = dojo.lastIndexOf(panels, currentPanel);
	var color = colors[index];
	var category = categories[index];
	var filtered = [];
	if (currentResource == null && currentField == null && currentFunction == null) {
		filtered = resourceTotalByUnit;
	} else if (currentField == null && currentFunction == null) {
		//currentResource must be non-null
		//Select the only the first field/function; but get all units.
		var firstField = null;
		for (var i = 0; i < staff.length; i++) {
			var item = staff[i];
			if (item.Resource == currentResource) {
				if (firstField == null) {
					firstField = item.Field;
					firstFunction = item.Function;
				}
				if (item.Function == firstFunction && item.Field == firstField)
					filtered.push(item);
			}
		}
	} else if (currentFunction == null) {
		//currentField must be non-null (currentResource may be null or non-null)
		//Select the only the first function; but get all units.
		var firstFunction = null
		for (var i = 0; i < staff.length; i++) {
			var item = staff[i];
			if (item.Field == currentField) {
				if (firstFunction == null)
					firstFunction = item.Function;
				if (item.Function == firstFunction)
					filtered.push(item);
			}
		}
	} else {
		//currentFunction must be non-null (currentResource/Field may be null or non-null)
		if (currentField == null)
			currentField = category
		filtered = dojo.filter(staff, function(item, i){
			return item.Field == currentField && item.Function == currentFunction;
		});
	}
	if (filtered == null) {
		console.log('Nothing for ' + currentResource + '-' + currentField + '-' + currentFunction);
		return;
	}
	var items = []
	var total = 0;
	for (var i = 0; i < filtered.length; i++) {
        var item = filtered[i];
		var text = '';
        var value = 0;
        var size = 0;
		if (currentFunction != null) {
			text = item.Unit_Function_FTE;
			value = parseFloat(text);		
			size = markerScaleFactorForFunction*value;		
		} else if (currentField != null){
			text = item.Unit_Field_FTE;
			value = parseFloat(text);		
			size = markerScaleFactorForField*value;
		} else if (currentResource != null){
			text = item.Unit_FTE;
			value = parseFloat(text);		
			size = markerScaleFactorForResource*value;
		} else {
			text = item.Total;
			value = parseFloat(text);		
			size = markerScaleFactorForAll*value;
		}
		total += value;
		items.push({'Unit':item.Unit, 'Text':text, 'Size':size});
	}
	total = Math.round(total*100)/100; 
	updateLabel(category, color, total);
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var unit = item.Unit;
		var text = item.Text;
        var size = item.Size;
		if (size > 0) {
			//var feature = getPointFeature(unit);
			if (unit in locations) {
				var geom = locations[unit]; //feature.geometry;
				//var link = '' //feature.attributes.LINK;
				var clr = getColorRGB(color);
				var markerColor = new dojo.Color([clr[0], clr[1], clr[2], markerTransparency])
				var outline = new esri.symbol.SimpleLineSymbol("solid", new dojo.Color([0, 0, 0, 0]), 1);
				var marker1 = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, outerMarkerMinSize + size, outline, markerColor);
				var graphic1 = new esri.Graphic(geom, marker1, {
					unit: unit,
					func: currentFunction,
					field: currentField,
					resource: currentResource
				});
				map.graphics.add(graphic1);
				//var clr = getColorRGB(color);
				//var r = new esri.symbol.SimpleLineSymbol("solid", new dojo.Color([0, 0, 0, markerTransparency]), 1);
				//var marker2 = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, innerMarkerSize, outline, new dojo.Color([0, 0, 0, 1]));
				var marker2 = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, innerMarkerSize, outline, innerMarkerColor);
				var graphic2 = new esri.Graphic(geom, marker2, {
					unit: unit,
					func: currentFunction,
					field: currentField,
					resource: currentResource
				});
				map.graphics.add(graphic2);
				var text1 = new esri.symbol.TextSymbol(text, font, markerTextColor);
				text1.setOffset(0, -4);
				var graphic3 = new esri.Graphic(geom, text1, {
					unit: unit,
					func: currentFunction,
					field: currentField,
					resource: currentResource
				});
				map.graphics.add(graphic3);
			} else {
				console.log('No location found for unit ' + unit);
			}
		}
    }
}
/*
function getPointFeature(unit) {
    for (var b = 0; b < features.length; b++) {
        var d = features[b];
        if (d.attributes.UNITCODE == unit) return d
    }
    return null
}
*/
function getColorRGB(a) {
    var b = dojo.colorFromString(a);
    return b.toRgb()
}

function compareResourceFTE(a, b) {
	fte_a = parseFloat(a.FTE)
	fte_b = parseFloat(b.FTE)
	//reverse sort
    if (fte_a < fte_b) return 1;
    if (fte_a > fte_b) return -1;
    return 0
}

function compareFunctionFTE(a, b) {
	fte_a = parseFloat(a.Function_FTE)
	fte_b = parseFloat(b.Function_FTE)
	//reverse sort
    if (fte_a < fte_b) return 1;
    if (fte_a > fte_b) return -1;
    return 0
}

function comparePersonFTE(a, b) {
	fte_a = parseFloat(a.Person_FTE)
	fte_b = parseFloat(b.Person_FTE)
	//reverse sort
    if (fte_a < fte_b) return 1;
    if (fte_a > fte_b) return -1;
    return 0
}

function comparePersonName(a, b) {
    if (a.Person < b.Person) return -1;
    if (a.Person > b.Person) return 1;
    return 0
}

function comparePersonLastName(a, b) {
	aname = a.Person.split(" ");
	bname = b.Person.split(" ");
    if (aname[1] < bname[1]) return -1;
    if (aname[1] > bname[1]) return 1;
    if (aname[0] < bname[0]) return -1;
    if (aname[0] > bname[0]) return 1;
    return 0
}
