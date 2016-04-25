const utils = require("./comradejs/utils");
const builtins = require("./comradejs/builtins");
const defaultConfig = require("./comradejs/default-config");
const anymatch = require("anymatch");
const _ = require("lodash");
const ERROR = (msg) => { throw new Error("Comrade Error: " + msg); };
const WARN = (msg) => { gComrade.showWarn && trace("[COMRADE WARN] " + msg)};
const INFO = (msg) => { gComrade.showInfo && trace(msg)};

const toShortname = (filename) => filename.split("/").pop();

var gFiles;
var gWatchFolders;
var gConfig;
var gComrade;
var primaryFocus = null;

const onBefore = () => {
    processPhase("before");
}

const onAfter = () => {
    processPhase("after");
}

module.exports = (config) => {
    gConfig = _.merge(defaultConfig, config);
    gConfig.preCompile = onBefore;
    gConfig.hooks = {onCompile: onAfter};
    
    gComrade = gConfig.comrade;
    applyPreset(gComrade);
    initialScan(gComrade);
    
    monitorFiles(gComrade);
    
    INFO(gConfig);
    return gConfig;
};

function applyPreset(params) {
    if(!params) ERROR("Missing preset params!");
    var presets = params.presets;
    if(!presets) ERROR("Missing presets");
    if(!presets.current) ERROR("Missing presets.current property!");
    var preset = presets[presets.current];
    if(!preset) ERROR("Incorrect/Missing preset name: " + presets.current);
    
    gConfig.comrade = _.mergeWith(gConfig.comrade, preset, (a,b,name) => {
        if(_.isArray(a) && _.isArray(b)) return a.concat(b);
    });
    
    gConfig.comrade.rootReal = gConfig.comrade.root;
    gConfig.comrade.root = endsWith(gConfig.comrade.root, "/") + presets.current;
    presets[presets.current] = null;
}

function initialScan(gComrade) {
    var adMatch = anymatch(gComrade.filePattern);
    var allFiles = getFiles(gComrade.root);
    
    findPrimaryFocus(allFiles);
    
    var adFolders = allFiles.filter((filename) => {
            var shortname = toShortname(filename);
            if(primaryFocus) {
                if(filename.indexOf(primaryFocus)==-1) return false;
            }
            return adMatch(shortname);
        });
    
    gComrade.publicPath = endsWith(gComrade.publicPath, "/");
    gWatchFolders = [gComrade.rootReal, "vendor"];
    gFiles = [];
    
    var presetpath = gComrade.root.replace(gComrade.rootReal, "");
    var subpath = cleanPath(gComrade.publicPath, presetpath);
    
    presetpath = endsWith(removeBeginsWith(presetpath, '/'), '/');
    
    var joinToJS = {}, joinToCSS = {}, filesObj = gConfig.files;
    adFolders.forEach((folder, id) => {
       var shortname = toShortname(folder);
       gWatchFolders.push(folder);
       
       if(primaryFocus!=null && folder.indexOf(primaryFocus)==-1) {
           return; //Skip other files if focusing on primary.
       }
       
       var out = subpath + shortname;
       var fileObj = {name: shortname, path: folder, out: out}; //id?
       trace(presetpath);
       joinToJS[presetpath+"js/"+shortname+".js"] = folder + "/*.js";
       joinToCSS[presetpath+"css/"+shortname+".css"] = folder + "/*.(css|less)";
       
       //Apply each fileObj transformations (from default & preset overrides)
       gComrade.forAdsFound.forEach((func) => func(fileObj));
       gFiles.push(fileObj);
    });
    
    INFO(gWatchFolders);
    INFO(joinToJS);
    INFO(joinToCSS);
    filesObj.javascripts.joinTo = joinToJS;
    filesObj.stylesheets.joinTo = joinToCSS;
    
    return adFolders;
}

function findPrimaryFocus(allFiles) {
    primaryFocus = null;
    var keyFilename = gComrade.primaryFocusFilename;
    allFiles.forEach((filename) => {
        var shortname = toShortname(filename);
        if(shortname==keyFilename) {
            if(primaryFocus!=null) ERROR("Can only have 1 \""+keyFilename+"\" file: " + primaryFocus);
            primaryFocus = filename.replace('/'+keyFilename, '');
            return;
        }
    });
    
    INFO("Focusing on primary file: " + primaryFocus);
}

function monitorFiles(params) {
    //root, types, callbacks
    var gMonitor = params.monitor || {};
    if(gMonitor.enabled===false) {
        WARN("Monitoring is disabled - remove 'enabled: false' in your config.");
        return;
    }
    
    var overallMD5 = null;
    var delay = whichever( gMonitor.delay, 1000 );
    var limit = whichever( gMonitor.limit, -1 );
    var lastTimeout = -1;
    
    (function check() {
        INFO("Monitoring...");
        
        if(limit==0) {
            trace("Monitoring stopped.");
            clearTimeout(lastTimeout);
            return;
        }
        limit--;
        lastTimeout = setTimeout(check, delay);
    })();
}

function processPhase(phase) {
    INFO("Processing: " + phase);
    const phaseConfig = gComrade[phase];
    //INFO(phaseConfig);
    
    traceJSONLine(gFiles);
}