'use strict';

const fs = require('fs');
const crypto = require('crypto');

RegExp.prototype['toJSON'] = function () {
    return this.source;
};

global.trace = console.log.bind(console);
global.traceJSON = (o) => trace(JSON.stringify(o, null, '  '));
global.traceJSONLine = (o) => trace(JSON.stringify(o));
global.getMD5 = function(str) {return crypto.createHash('md5').update(str).digest('hex');}
global.whichever = function(a, b) {if(a!=null) return a; return b; };
global.endsWith = function(path, char) {
    if (path.charAt(path.length - 1) != char)
        return path + char;
    return path;
};

global.removeBeginsWith = function(path, char) {
    if (path.indexOf(char) == 0)
        return path.substr(char.length);
    return path;
};

global.cleanPath = function() {
    var results = '';
    for(var a=0; a<arguments.length; a++) {
        var part = arguments[a];
        if(part==null) throw new Error("cleanPath error, passed 'null'!");
        if(part.charAt(0)=='/') part = part.substr(1);
        if(part.charAt(part.length-1)!='/') part += '/';
        results += part;
    }
    return results;
};

global.resolveHandleBars = (str, obj) => {
    if (str == null)
        return null;
    if (str.length > 0) {
        for (var prop in obj) {
            if (!obj.hasOwnProperty(prop))
                continue;
            //obj[prop]
            var propHandlebar = "{{" + prop + "}}";
            while (str.indexOf(propHandlebar) > -1) {
                str = str.replace(propHandlebar, obj[prop]);
            }
        }
    }
    return str;
}

global.resolveEnvVars = (str) => {
    return str.replace(/%([^%]+)%/g, (_, envName) => process.env[envName] );
}

global.reduceExistingDirectories = (arr) => {
    var TAG_CHECK_EXISTS = "@@";
    for (var r = arr.length; --r >= 0;) {
        var resolved = arr[r];
        if (resolved.indexOf(TAG_CHECK_EXISTS) == 0) {
            resolved = resolved.substr(TAG_CHECK_EXISTS.length);
            if (!fileExists(resolved)) {
                arr.splice(r, 1);
                continue;
            }
            arr[r] = resolved;
        }
    }
    return arr;
}

global.getFiles = (path, exceptions, allFiles) => {
    if (allFiles === void 0) { allFiles = []; }
    if (exceptions === void 0) { exceptions = []; }
    path = endsWith(path, "/");
    var files = fs.readdirSync(path);
    files.forEach(function (file) {
        var fullpath = path + file;
        if (file.indexOf(".") == 0)
            return;
        if (fs.lstatSync(fullpath).isDirectory()) {
            if (exceptions.indexOf(file) > -1)
                return;
            allFiles.push(fullpath);
            getFiles(fullpath, exceptions, allFiles);
        }
        else {
            allFiles.push(fullpath);
        }
    });
    return allFiles;
}

global.getDirectories = (path) => {
    path = endsWith(path, "/");
    var results = [];
    var files = fs.readdirSync(path);
    files.forEach(function(file) {
        if(file.indexOf(".")==0) return;
        var fullpath = path + file;
        if (fs.lstatSync(fullpath).isDirectory()) {
            results.push(fullpath);
        }
    });
    return results;
}

global.fileExists = (path) => {
    try {
        fs.statSync(path);
        return true;
    }
    catch (e) {
        return false;
    }
}

global.fileRead = (path, replacements) => {
    if (replacements === void 0) { replacements = null; }
    var data = fs.readFileSync(path, UTF_8);
    if (replacements != null) {
        data = resolveHandleBars(data, replacements);
    }
    return data;
}

global.fileCopy = (from, to) => {
    fs.createReadStream(from).pipe(fs.createWriteStream(to));
}