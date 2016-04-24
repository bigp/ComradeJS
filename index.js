//index.js
var trace = global.trace = console.log.bind(console);
var anymatch = require("anymatch");
var fs = require("fs");
var utils = require("./comradejs/utils");

var myFiles = getFiles("./",["node_modules"]);


trace(myFiles);