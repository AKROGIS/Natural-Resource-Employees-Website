// Constants used in the javascript app code.  Needs to be kept in sync with the html/css design

//Panel animation
var panelWidthClosed = 75;   //pixels
var panelWidthOpen   = 310;  //pixels
var panelBounceTime  = 700;  //milliseconds
var panelEasing      = 'bounceOut'; //See https://dojotoolkit.org/reference-guide/1.9/dojo/fx/easing.html for other options

//The following lists must be the same length, and all the elements at the same index are related

//The name of a resource 'Field' in the staff.js data to display in the related panel.
//  except 'All Resources' which is not a resouce field, but a code to display the list of 'Resources' in the related panel 
var categories = ['All Resources','Data Management','Outreach and Administration','Cultural Resource Sciences','Natural Resources','Biological Sciences','Fire Management','Physical Sciences','Planning','Subsistence','Furlough','NonResource'];

//the id of the panel div that will show this category
var panels = ['panel1','panelA','panelB','panelC','panelD','panelE','panelF','panelG','panelH','panelI','panelJ','panelK'];

//the id of the text div in the panel - where the subtext for the category will be created 
var blocks = ['txt1','txtA','txtB','txtC','txtD','txtE','txtF','txtG','txtH','txtI','txtJ','txtK'];

//the color scheme for the panels - also used for drawing circles on the map, and other visual elements
var colors = ['#63891F','#7F6000','#BF9000','#C55A11','#3653B0','#5F73B6','#5C8EE4','#86A6DA','#9A4E90','#990033','#B0A9AC','#666666'];

//Panel that will be open on startup
var currentPanel = 'panel1';

//Map Marker Symbols
var markerTransparency           = 0.6;  //0.0 is fully transparent and 1.0 has no transparency
var innerMarkerSize              = 25;
var outerMarkerMinSize           = 30;
var markerScaleFactorForFunction = 5;
var markerScaleFactorForField    = 5;
var markerScaleFactorForResource = 5;
var markerScaleFactorForAll      = 5;
var innerMarkerColor             = '#000000';
var markerTextColor              = '#FFFFFF';
var markerTextSize               = '10px';
