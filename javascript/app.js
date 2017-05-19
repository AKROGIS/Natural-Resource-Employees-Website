var lyrLoaded = false;
var map;
var lyr;
var features;
var currentPanel = 'panelA';
var selectionSymbol;
var closetimer;
var medals;
var font;
dojo.addOnLoad(loadXML);

function init() {
    esri.config.defaults.io.proxyUrl = config.proxyURL;
    font = new esri.symbol.Font("10px", esri.symbol.Font.STYLE_NORMAL, esri.symbol.Font.VARIANT_NORMAL, esri.symbol.Font.WEIGHT_NORMAL, "Arial");
    var d = esri.arcgis.utils.createMap(config.webmap, "map", {
        mapOptions: {
            slider: false,
            nav: false,
            logo: false
        },
        ignorePopups: true
    });
    d.addCallback(function (a) {
        map = a.map;
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
        dojo.connect(map, "onUpdateEnd", layersUpdateEnd);
        dojo.connect(map, "onExtentChange", mapExtentChange);
        var b = a.itemInfo.itemData.operationalLayers;
        if (map.loaded) {
            initMap(b)
        } else {
            dojo.connect(map, "onLoad", function () {
                initMap(b)
            })
        }
    });
    d.addErrback(function (a) {
        console.log("Map creation failed: ", dojo.toJson(a))
    })
}

function initMap(g) {
    var e = dojo.map(g, function (a, b) {
        if (a.title == config.lyr) {
            lyr = a.layerObject;
            var d = map.graphics;
            dojo.connect(d, "onClick", lyrClick)
        }
    })
}

function mapExtentChange() {}

function togglePanel(a) {
    if (a != currentPanel) {
        var b = dojo.byId(currentPanel);
        var d = dojo.byId(a);
        var g = animatePanel(b, 1000, 300, 150, 'bounceOut');
        var e = animatePanel(d, 1000, 150, 300, 'bounceOut');
        dojo.fx.combine([g, e]).play();
        currentPanel = a;
        toggleMedal()
    }
}

function toggleMedal() {
    switch (currentPanel) {
    case "panelA":
        grade = "A";
        break;
    case "panelB":
        grade = "B";
        break;
    case "panelC":
        grade = "C";
        break;
    case "panelD":
        break
    }
    lyr.clearSelection();
    renderMedals()
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

function layersUpdateEnd() {
    if (lyrLoaded == false) {
        features = lyr.graphics.slice();
        lyrLoaded = true;
        renderMedals();
        map.setLevel(3)
    }
}

function updateMedalCount(a, b, d, g) {
    var e = dojo.byId("txtA");
    if (e != null) e.innerHTML = a;
    var c = dojo.byId("txtB");
    if (c != null) c.innerHTML = b;
    var f = dojo.byId("txtC");
    if (f != null) f.innerHTML = d;
    var h = dojo.byId("txtD");
    if (h != null) h.innerHTML = g
}

function lyrClick(a) {
    var b = a.graphic;
    var d = "http://london2012.com" + b.attributes.LINK;
    window.open(d)
}

function doMapZoom(a) {
    var b = map.getLevel() + a;
    map.setLevel(b)
}

function getMedals() {
    var l = esri.request({
        url: 'http://apify.heroku.com/api/olympics2012_medals.json',
        handleAs: "json"
    }, {
        useProxy: true
    });
    l.then(function (a) {
        medals = fixMedals(a);
        var b = "";
        var d = "";
        var g = "";
        var e = "";
        var c = 0;
        medals.sort(compareTotal);
        medals.reverse();
        for (c = 0; c < 3; c++) {
            var f = medals[c];
            var h = f.country;
            var i = f.total;
            b += h + "<br><span class='txtNum'>" + i + "</span><br>"
        }
        medals.sort(compareGold);
        medals.reverse();
        for (c = 0; c < 3; c++) {
            var f = medals[c];
            var h = f.country;
            var j = f.gold;
            d += h + "<br><span class='txtNum'>" + j + "</span><br>"
        }
        medals.sort(compareSilver);
        medals.reverse();
        for (c = 0; c < 3; c++) {
            var f = medals[c];
            var h = f.country;
            var k = f.silver;
            g += h + "<br><span class='txtNum'>" + k + "</span><br>"
        }
        medals.sort(compareBronze);
        medals.reverse();
        for (c = 0; c < 3; c++) {
            var f = medals[c];
            var h = f.country;
            var m = f.bronze;
            e += h + "<br><span class='txtNum'>" + m + "</span><br>"
        }
        updateMedalCount(b, d, g, e)
    }, function (a) {
        console.warn(a)
    })
}

function getMedalsData() {
    medals = fixMedals(medalsJSON);
    var a = "";
    var b = "";
    var d = "";
    var g = "";
    var e = 0;
    medals.sort(compareTotal);
    medals.reverse();
    for (e = 0; e < 3; e++) {
        var c = medals[e];
        var f = c.country;
        var h = c.total;
        a += f + "<br><span class='txtNum'>" + h + "</span><br>"
    }
    medals.sort(compareGold);
    medals.reverse();
    for (e = 0; e < 3; e++) {
        var c = medals[e];
        var f = c.country;
        var i = c.gold;
        b += f + "<br><span class='txtNum'>" + i + "</span><br>"
    }
    medals.sort(compareSilver);
    medals.reverse();
    for (e = 0; e < 3; e++) {
        var c = medals[e];
        var f = c.country;
        var j = c.silver;
        d += f + "<br><span class='txtNum'>" + j + "</span><br>"
    }
    medals.sort(compareBronze);
    medals.reverse();
    for (e = 0; e < 3; e++) {
        var c = medals[e];
        var f = c.country;
        var k = c.bronze;
        g += f + "<br><span class='txtNum'>" + k + "</span><br>"
    }
    updateMedalCount(a, b, d, g)
}

function fixMedals(a) {
    var b = [];
    for (var d = 0; d < a.length; d++) {
        var g = a[d];
        var e = {
            country: g.country,
            total: parseInt(g.total),
            gold: parseInt(g.gold),
            silver: parseInt(g.silver),
            bronze: parseInt(g.bronze)
        };
        b.push(e)
    }
    return b
}

function renderMedals() {
    map.graphics.clear();
    var a = "#886197";
    for (var b = 0; b < medals.length; b++) {
        var d = medals[b];
        var g = d.country;
        var e = d.total;
        var c = d.gold;
        var f = d.silver;
        var h = d.bronze;
        var i = 0;
        switch (currentPanel) {
        case "panelA":
            a = "#886197";
            i = e;
            break;
        case "panelB":
            a = "#f2c202";
            i = c;
            break;
        case "panelC":
            a = "#696969";
            i = f;
            break;
        case "panelD":
            a = "#bb7028";
            i = h;
            break
        }
        if (i > 0) {
            var j = getCountryFeature(g);
            if (j) {
                var k = j.geometry;
                var m = j.attributes.LINK;
                var l = getColorRGB(a);
                var o = new esri.symbol.SimpleLineSymbol("solid", new dojo.Color([0, 0, 0, 0]), 1);
                var p = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 20 + i * 2, o, new dojo.Color([l[0], l[1], l[2], 0.5]));
                var q = new esri.Graphic(k, p, {
                    LINK: m
                });
                map.graphics.add(q);
                var l = getColorRGB(a);
                var r = new esri.symbol.SimpleLineSymbol("solid", new dojo.Color([0, 0, 0, 0.5]), 1);
                var s = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 20, r, new dojo.Color([0, 0, 0, 1]));
                var t = new esri.Graphic(k, s, {
                    LINK: m
                });
                map.graphics.add(t);
                var n = new esri.symbol.TextSymbol(i, font, "#ffffff");
                n.setOffset(0, -4);
                var u = new esri.Graphic(k, n, {
                    LINK: m
                });
                map.graphics.add(u)
            } else {
                console.log(g)
            }
        }
    }
}

function getCountryFeature(a) {
    for (var b = 0; b < features.length; b++) {
        var d = features[b];
        if (d.attributes.NAME == a) return d
    }
    return null
}

function getColorRGB(a) {
    var b = dojo.colorFromString(a);
    return b.toRgb()
}

function compareTotal(a, b) {
    if (a.total < b.total) return -1;
    if (a.total > b.total) return 1;
    return 0
}

function compareGold(a, b) {
    if (a.gold < b.gold) return -1;
    if (a.gold > b.gold) return 1;
    return 0
}

function compareSilver(a, b) {
    if (a.silver < b.silver) return -1;
    if (a.silver > b.silver) return 1;
    return 0
}

function compareBronze(a, b) {
    if (a.bronze < b.bronze) return -1;
    if (a.bronze > b.bronze) return 1;
    return 0
}
