var config = {};

function loadXML() {
    var f = "config.xml";
    var d = esri.urlToObject(document.location.href);
    var g = d.path.lastIndexOf('/') + 1;
    var e = esri.urlToObject(d.path.substr(0, g) + f);
    var h = esri.request({
        url: e.path,
        content: e.query,
        handleAs: "xml"
    }, {
        useProxy: false
    });
    h.then(function (a) {
        var b = dojo.query("config", a)[0];
        var c = findChildNode("webmap", b);
        config.webmap = getDomNodeText(c);
        var i = findChildNode("lyr", b);
        config.lyr = getDomNodeText(i);
        var j = findChildNode("proxyURL", b);
        config.proxyURL = getDomNodeText(j);
        init();
        getStaffData()
    }, function (a) {
        console.warn(a)
    })
}

function findChildNode(a, b) {
    var c = dojo.query(a, b);
    if (c.length > 0) {
        return c[0]
    } else {
        return null
    }
}

function getDomNodeText(a) {
    return (a.firstChild.data)
}

function getColor(a) {
    var b = getDomNodeText(a);
    return b || "000000"
}