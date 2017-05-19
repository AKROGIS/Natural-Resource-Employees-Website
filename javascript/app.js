//ArcGIS Map Object
var map;

//Resource Employee Data
var nreData = {};

//Panel that is currently open
var currentPanel = 'panel1';

function setupConfig() {
    require(["dojo/fx/easing"], function(Easing) {
        config.panelEasing = Easing[config.panelEasingName];
        if (!config.panelEasing) {
            config.panelEasing = Easing.linear;
        }
    });
}

function loadNreData() {
    require(['dojo/json',
            'dojo/text!./data/people.json',
            'dojo/text!./data/staff.json',
            'dojo/text!./data/unit_names.json',
            'dojo/text!./data/unit_locations.json'],
        function (JSON, personData, staffData, unitNameData, unitLocationData) {
            var staff = JSON.parse(staffData);
            getStaffData(staff);
            getResourceList(staff);
            getResourceTotalByUnit(staff);
            getPersonnelData(JSON.parse(personData));
            getUnitShortNameLookup(JSON.parse(unitNameData));
            getUnitLocations(JSON.parse(unitLocationData));
            require(["dojo/domReady!"],function(){
                setupPanel();
                drawRegionalResources();
            });
        });
}

function loadMap() {
    require([
        "esri/map",
        "esri/arcgis/utils",
        "dojo/on",
        "dojo/domReady!"
    ], function (Map, ArcgisUtils, on) {
        //if accessing webmap from a portal outside of ArcGIS Online, uncomment and replace path with portal URL
        //arcgisUtils.arcgisUrl = "https://pathto/portal/sharing/content/items";
        ArcgisUtils.createMap(config.webmap, "map", {
            mapOptions: {
                slider: false,
                nav: false,
                logo: false,
                wrapAround180: true
            },
            ignorePopups: true
        }).then(function (response) {
            //update the app
            map = response.map;
            on(document.getElementById('map'), 'resize', map.resize);
            if (map.loaded) {
                initMap();
            } else {
                on(map, "load", initMap);
            }
        });
    });
}

function initMap() {
    require(["esri/InfoTemplate"], function (InfoTemplate) {
        var template = new InfoTemplate();
        template.setTitle(infoTitle);
        template.setContent(infoContent);
        map.graphics.setInfoTemplate(template);
        drawRegionalResources();
    });
}

function drawRegionalResources() {
    if (map && map.loaded && nreData && nreData.unitLocations) {
        map.setLevel(5);
        selectRegion();
    }
}

function doMapZoom(zoomInc) {
    var newZoom = map.getLevel() + zoomInc;
    map.setLevel(newZoom);
}

function infoTitle(graphic) {
    return nreData.unitNames[graphic.attributes.unit];
}

function infoContent(graphic) {
    var a = graphic.attributes;
    var f = filterPersonel(nreData.personnel, a.unit, a.resource, a.field, a.func);
    var t = "";
    if (f == null) {
        t += "<span class='popup_error'>Unable to show this list.  Please try another Unit or Category.</span>";
    } else {
        f = mergeFteByPerson(f);
        //f.sort(comparePersonFTE);
        t += "<table class='popup_table'><tbody>";
        for (var i = 0; i < f.length; i++) {
            var fte = Math.round(f[i].Person_FTE * 100) / 100;
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

function filterPersonel(personel, unit, res, field, func) {
    var filtered = null;
    if (unit == null)
        return filtered;
    if (field != null && func != null) {
        filtered = personel.filter(function(item) {
            return item.Field == field && item.Function == func && item.Unit == unit;
        });
    } else if (field != null) {
        filtered = personel.filter(function(item) {
            return item.Field == field && item.Unit == unit;
        });
    } else if (res != null) {
        filtered = personel.filter(function(item) {
            return item.Resource == res && item.Unit == unit;
        });
    } else {
        filtered = personel.filter(function(item) {
            return item.Unit == unit;
        });
    }
    return filtered;
}

function mergeFteByPerson(unitStaff) {
    var emps = {};
    for (var i = unitStaff.length - 1; i >= 0; i--) {
        individual = unitStaff[i];
        if (individual.Person in emps) {
            emps[individual.Person].Person_FTE += individual.Person_FTE
        } else {
            //make a copy, otherwise each popup will be additive
            emps[individual.Person] = {
                "Person": individual.Person,
                "Network": individual.Network,
                "Person_FTE": individual.Person_FTE
            };
        }
    }
    //return as a list of staff
    var list = [];
    for (var individual in emps) {
        if(emps.hasOwnProperty(individual)) {
            list.push(emps[individual]);
        }
    }
    list.sort(comparePersonLastName);
    return list;
}

function togglePanel(panel) {
    if (panel != currentPanel) {
        require(["dojo/_base/fx"], function (fx) {
            var oldPanel = document.getElementById(currentPanel);
            var newPanel = document.getElementById(panel);
            var closeAction = animatePanel(oldPanel, config, fx, false);
            var openAction = animatePanel(newPanel, config, fx, true);
            fx.combine([closeAction, openAction]).play();
            currentPanel = panel;
        });
    }
    var index = config.panels.lastIndexOf(currentPanel);
    var category = config.categories[index];
    if (category == 'All Resources') {
        selectRegion()
    } else {
        selectField(category)
    }
}

function animatePanel(node, config, fx, open) {
    //assume we are closing
    var start = config.panelWidthOpen;
    var end = config.panelWidthClosed;
    if (open) {
        start = config.panelWidthClosed;
        end = config.panelWidthOpen;
    }
    return fx.animateProperty({
        node: node,
        duration: config.panelBounceTime,
        easing: config.panelEasing,
        properties: {
            width: {
                end: end,
                start: start
            }
        }
    });
}

function setupPanel() {
    //Primary Resources (category 0)
    //get the item for the first field/function/unit for each resource
    var filtered = nreData.resourceList;
    filtered.sort(compareResourceFTE);
    var html = "";
    filtered.forEach(function(item) {
        var f = item.Resource;
        var h = item.FTE;
        html += "<a href='javascript:void(0)' onclick='selectResource(\"" + f + "\");'>" + f + "&nbsp<span class='txtNum'>" + h + "</span></a><br>";
    });

    var blk = document.getElementById(config.blocks[0]);
    if (blk != null) {
        blk.innerHTML = html;
    }

    config.categories.forEach(function(category, index) {
        filtered = nreData.staff.filter(function (item) {
            return item.Field == category && item.Unit == 'akro';
        });
        filtered.sort(compareFunctionFTE);
        html = "";
        filtered.forEach(function (item) {
            var f = item.Function;
            var h = item.Function_FTE;
            html += "<a href='javascript:void(0)' onclick='selectFunction(\"" + f + "\");'>" + f + "&nbsp<span class='txtNum'>" + h + "</span></a><br>";
        });
        blk = document.getElementById(config.blocks[index]);
        if (blk != null) {
            blk.innerHTML = html;
        }
    });
}

function getStaffData(staffJSON) {
    nreData.staff = staffJSON;
}

function getPersonnelData(personJSON) {
    nreData.personnel = personJSON;
}

function getUnitShortNameLookup(unitJSON) {
    nreData.unitNames = unitJSON;
}

function getUnitLocations(unitJSON) {
    nreData.unitLocations = {};
    require(["esri/geometry/Point"], function (Point) {
        for (var unit in unitJSON) {
            if (unitJSON.hasOwnProperty(unit)) {
                var latLongPair = unitJSON[unit];
                nreData.unitLocations[unit] = new Point(latLongPair);
            }
        }
    });
}

function getResourceList(staffJSON) {
    var staff = staffJSON;
    //returns the staff record for the last field/function/unit for each resource
    //use a dictionary (object/hash) so that we automatically uniquify on the key
    var resources = {};
    staff.forEach(function(item) {
        resources[item.Resource] = item;
    });
    //turn our dictionary into a list of staff items
    var list = [];
    for (var resource in resources) {
        list.push(resources[resource]);
    }
    nreData.resourceList = list;
}

function getResourceTotalByUnit(staffJSON) {
    var staff = staffJSON;
    //Creates a list of objects each with a Unit and Total property
    //Total is the sum of all Unit_FTEs across all Resource categories
    var items = {};
    staff.forEach(function(item) {
        if (item.Unit in items) {
            items[item.Unit][item.Resource] = item.Unit_FTE
        } else {
            items[item.Unit] = {};
        }
    });
    var list = [];
    for (var unit in items) {
        if (items.hasOwnProperty(unit)) {
            var resources = items[unit];
            var total = 0;
            for (var resource in resources) {
                if (resources.hasOwnProperty(resource)) {
                    total += parseFloat(resources[resource]);
                }
            }
        }
        total = Math.round(total * 100) / 100;
        list.push({'Unit': unit, 'Total': total.toString()});
    }
    nreData.resourceTotalByUnit = list;
}

function updateLabel(category, color, total, current) {
    var label = document.getElementById("selectionLabel");
    if (label != null) {
        label.style["background-color"] = color;
        var text;
        if (current.function == null) {
            if (current.resource == null) {
                text = category;
            } else {
                text = "All " + current.resource;
            }
        } else {
            text = category + " - " + current.function;
        }
        label.innerHTML = text + "&nbsp<span class='labelNum'>" + total + "</span>"
    }
}

function selectRegion() {
    var current = {};
    current.resource = null;
    current.field = null;
    current.function = null;
    drawStaffCircles(current);
}

function selectResource(resource) {
    var current = {};
    current.resource = resource;
    current.field = null;
    current.function = null;
    drawStaffCircles(current);
}

function selectField(field) {
    var current = {};
    current.resource = null;
    current.field = field;
    current.function = null;
    drawStaffCircles(current);
}

function selectFunction(functn) {
    var current = {};
    current.resource = null;
    current.field = null;
    current.function = functn;
    drawStaffCircles(current);
}

function drawStaffCircles(current) {
    require(["dojo/_base/Color",
            "esri/symbols/SimpleMarkerSymbol",
            "esri/symbols/SimpleLineSymbol",
            "esri/symbols/TextSymbol",
            "esri/symbols/Font",
            "esri/graphic"
        ],
        function (Color,
                  SimpleMarkerSymbol,
                  SimpleLineSymbol,
                  TextSymbol,
                  Font,
                  Graphic) {
            map.infoWindow.hide();
            map.graphics.clear();
            var staff = nreData.staff;
            var locations = nreData.unitLocations;
            var index = config.panels.lastIndexOf(currentPanel);
            var color = config.colors[index];
            var category = config.categories[index];
            var filtered = [];
            if (current.resource == null && current.field == null && current.function == null) {
                filtered = nreData.resourceTotalByUnit;
            } else if (current.field == null && current.function == null) {
                //current.resource must be non-null
                //Select the only the first field/function; but get all units.
                var firstField = null;
                staff.forEach(function(item) {
                    if (item.Resource == current.resource) {
                        if (firstField == null) {
                            firstField = item.Field;
                            firstFunction = item.Function;
                        }
                        if (item.Function == firstFunction && item.Field == firstField)
                            filtered.push(item);
                    }
                });
            } else if (current.function == null) {
                //current.field must be non-null (current.resource may be null or non-null)
                //Select the only the first function; but get all units.
                var firstFunction = null;
                staff.forEach(function(item) {
                    if (item.Field == current.field) {
                        if (firstFunction == null)
                            firstFunction = item.Function;
                        if (item.Function == firstFunction)
                            filtered.push(item);
                    }
                });
            } else {
                //current.function must be non-null (current.resource/Field may be null or non-null)
                if (current.field == null) {
                    current.field = category;
                }
                filtered = staff.filter(function (item) {
                    return item.Field == current.field && item.Function == current.function;
                });
            }
            if (filtered == null) {
                console.log('Nothing for ' + current.resource + '-' + current.field + '-' + current.function);
                return;
            }
            var items = [];
            var total = 0;
            filtered.forEach(function(item) {
                var text = '';
                var value = 0;
                var size = 0;
                if (current.function != null) {
                    text = item.Unit_Function_FTE;
                    value = parseFloat(text);
                    size = config.markerScaleFactorForFunction * value;
                } else if (current.field != null) {
                    text = item.Unit_Field_FTE;
                    value = parseFloat(text);
                    size = config.markerScaleFactorForField * value;
                } else if (current.resource != null) {
                    text = item.Unit_FTE;
                    value = parseFloat(text);
                    size = config.markerScaleFactorForResource * value;
                } else {
                    text = item.Total;
                    value = parseFloat(text);
                    size = config.markerScaleFactorForAll * value;
                }
                total += value;
                items.push({'Unit': item.Unit, 'Text': text, 'Size': size});
            });
            total = Math.round(total * 100) / 100;
            updateLabel(category, color, total, current);

            items.forEach(function(item) {
                var unit = item.Unit;
                var text = item.Text;
                var size = item.Size;
                if (size > 0) {
                    if (unit in locations) {
                        var geom = locations[unit];
                        var clr = Color.fromString(color).toRgb();
                        var markerColor = new Color([clr[0], clr[1], clr[2], config.markerTransparency]);
                        var outline = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0, 0]), 1);
                        var marker1 = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, config.outerMarkerMinSize + size, outline, markerColor);
                        var graphic1 = new Graphic(geom, marker1, {
                            unit: unit,
                            func: current.function,
                            field: current.field,
                            resource: current.resource
                        });
                        map.graphics.add(graphic1);
                        var marker2 = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, config.innerMarkerSize, outline, config.innerMarkerColor);
                        var graphic2 = new Graphic(geom, marker2, {
                            unit: unit,
                            func: current.function,
                            field: current.field,
                            resource: current.resource
                        });
                        map.graphics.add(graphic2);
                        var font = new Font(config.markerTextSize);
                        var marker3 = new TextSymbol(text, font, new Color(config.markerTextColor));
                        marker3.setOffset(0, -4);
                        var graphic3 = new Graphic(geom, marker3, {
                            unit: unit,
                            func: current.function,
                            field: current.field,
                            resource: current.resource
                        });
                        map.graphics.add(graphic3);
                    } else {
                        console.log('No location found for unit ' + unit);
                    }
                }
            });
        });
}

function compareResourceFTE(a, b) {
    var fte_a = parseFloat(a['FTE']);
    var fte_b = parseFloat(b['FTE']);
    //reverse sort
    if (fte_a < fte_b) return 1;
    if (fte_a > fte_b) return -1;
    return 0
}

function compareFunctionFTE(a, b) {
    var fte_a = parseFloat(a['Function_FTE']);
    var fte_b = parseFloat(b['Function_FTE']);
    //reverse sort
    if (fte_a < fte_b) return 1;
    if (fte_a > fte_b) return -1;
    return 0
}

function comparePersonLastName(a, b) {
    var aname = a.Person.split(" ");
    var bname = b.Person.split(" ");
    if (aname[1] < bname[1]) return -1;
    if (aname[1] > bname[1]) return 1;
    if (aname[0] < bname[0]) return -1;
    if (aname[0] > bname[0]) return 1;
    return 0
}
/*
 function comparePersonFTE(a, b) {
 var fte_a = parseFloat(a.Person_FTE);
 var fte_b = parseFloat(b.Person_FTE);
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
 */
