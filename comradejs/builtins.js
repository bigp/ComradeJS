//Some built-in tasks for ComradeJS
var TAG_MERGE = "@merge:";
var TAG_PASTE = "@paste:";
var TAG_SOURCES = "src=,href=".split(',');
var buffers = {};

module.exports = {
	'merge-and-paste': function mergeAndPaste(adUnit, configArgs) {
		var _THIS = this;
		if (configArgs == null) {
			info("ERROR: incorrect 'args' passed to built-in task 'merge-and-paste': " + configArgs);
			return;
		}
		var htmlOut = _THIS._outputDir + removeBeginsWith(resolveHandleBars(configArgs[0], adUnit), "./");
		var htmlTemplate = resolveHandleBars(_THIS._inputFileContent, adUnit);
		if (htmlTemplate == null || htmlTemplate.length == 0)
			return;
		var mergedLines = [];
		var htmlLines = htmlTemplate.split("\n");
		function getSource(tag, line, lookupData) {
			var result = { name: null, data: null, filename: null, altFilename: null };
			var tagStart = line.indexOf(tag);
			if (tagStart == -1)
				return null;
			var name = line.substr(tagStart + tag.length).trim();
			var matchName = name.match(/[a-z0-9\-_\.]*/i);
			if (matchName == null || matchName.length == 0) {
				result.name = null;
			}
			else {
				result.name = matchName[0];
			}
			if (lookupData) {
				for (var t = TAG_SOURCES.length; --t >= 0;) {
					var src = TAG_SOURCES[t];
					var srcID = line.indexOf(src);
					if (srcID == -1)
						continue;
					var quoteStart = srcID + src.length + 1;
					var quoteEnd = line.indexOf("\"", quoteStart);
					result.filename = removeBeginsWith(line.substring(quoteStart, quoteEnd), "/");
					result.altFilename = _THIS._outputDir + result.filename;
					if (fileExists(result.filename)) {
						result.data = readFile(result.filename, adUnit);
					}
					else if (fileExists(result.altFilename)) {
						result.data = readFile(result.altFilename, adUnit);
					}
					else {
						info("'merge-and-paste' > SRC=/HREF= not found: " + result.filename + " || " + result.altFilename);
						continue;
					}
					break;
				}
			}
			return result;
		}
		//First, iterate to "merge" the data in specific string variables:
		for (var m = 0; m < htmlLines.length; m++) {
			var line = htmlLines[m];
			var o = getSource(TAG_MERGE, line, true);
			if (o == null || o.name == null || o.data == null) {
				mergedLines.push(line);
				continue;
			}
			if (buffers[o.name] == null) {
				buffers[o.name] = [];
			}
			info("  Writing to the buffer: " + o.name + "\t-> " + o.data.length + " chars ...");
			buffers[o.name].push(o.data);
		}
		for (var p = 0; p < mergedLines.length; p++) {
			var o = getSource(TAG_PASTE, mergedLines[p], false);
			if (o == null || o.name == null)
				continue;
			var buffer = buffers[o.name];
			if (buffer == null) {
				info("  Buffer is empty: " + o.name);
				continue;
			}
			mergedLines[p] = buffer.join("\n");
		}
		var output = mergedLines.join("\n");
		function escapedForRegex(str) {
			str = str.replace(/\./g, "\\.");
			str = str.replace(/\-/g, "\\-");
			return str;
		}
		/**
		 * TODO: Does the ARGS really need to be a string?
		 *      Couldn't it sometimes be a raw Object that could be
		 *      accessed by its fields?
		 */
		if (configArgs.length >= 2) {
			var extraParams = JSON.parse(configArgs[1]);
			if (extraParams.replace) {
				var reps = extraParams.replace;
				for (var r = 0; r < reps.length; r += 2) {
					var a = escapedForRegex(reps[r]);
					var b = reps[r + 1];
					output = output.replace(new RegExp(a, "g"), b);
				}
			}
		}

		fs.writeFileSync(htmlOut, output, UTF_8);
		info("  -- Writing HTML file: " + htmlOut);
		_THIS._lastHTMLFile = htmlOut;
	}
};