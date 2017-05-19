// Customizable values used in the javascript app code.  Needs to be kept in sync with the html/css design

var config = {
    // Background web map (must be a public map on AGOL); only used as a background
    "webmap": "57465a63774048d2987cf47bac323d1a",


    //Panel definition
    //The following lists must be the same length, and all the elements at the same index are related

    //The name of a resource 'Field' in the staff.json data to display in the related panel.
    //  except 'All Resources' which is not a resouce field, but a code to display the list of 'Resources' in the related panel
    "categories": ['All Resources','Data Management','Outreach and Administration','Cultural Resource Sciences','Natural Resources',
                   'Biological Sciences','Fire Management','Physical Sciences','Planning','Subsistence','Furlough','NonResource'],

    //the id of the panel div that will show this category
    "panels": ['panel1','panelA','panelB','panelC','panelD','panelE','panelF','panelG','panelH','panelI','panelJ','panelK'],

    //the id of the text div in the panel - where the subtext for the category will be created
    "blocks": ['txt1','txtA','txtB','txtC','txtD','txtE','txtF','txtG','txtH','txtI','txtJ','txtK'],

    //the color scheme for the panels - also used for drawing circles on the map, and other visual elements
    "colors": ['#63891F','#7F6000','#BF9000','#C55A11','#3653B0','#5F73B6','#5C8EE4','#86A6DA','#9A4E90','#990033','#B0A9AC','#666666'],


    //Panel animation
    "panelWidthClosed": 75,   //pixels
    "panelWidthOpen":   310,  //pixels
    "panelBounceTime":  700,  //milliseconds
    "panelEasingName":  'bounceOut', //See https://dojotoolkit.org/reference-guide/1.9/dojo/fx/easing.html for other options


    //Map Marker Symbology
    "markerTransparency":           0.6,  //0.0 is fully transparent and 1.0 has no transparency
    "innerMarkerSize":              25,
    "outerMarkerMinSize":           30,
    "markerScaleFactorForFunction": 5,
    "markerScaleFactorForField":    5,
    "markerScaleFactorForResource": 5,
    "markerScaleFactorForAll":      5,
    "innerMarkerColor":             '#000000',
    "markerTextColor":              '#FFFFFF',
    "markerTextSize":               '10px'

};

