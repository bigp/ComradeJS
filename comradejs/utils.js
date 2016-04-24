var fs = require("fs");

global.clear = () => trace('\033[2J');
RegExp.prototype['toJSON'] = function () {
    return this.source;
};

global.traceJSON = (o) => trace(JSON.stringify(o, null, '  '));

global.endsWith = (path, char) => {
    if (path.charAt(path.length - 1) != char)
        return path + char;
    return path;
}

global.removeBeginsWith = (path, char) => {
    if (path.indexOf(char) == 0)
        return path.substr(char.length);
    return path;
}

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