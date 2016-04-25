module.exports = {
    comrade: {
        root: "app",
        filePattern: /^(en|fr)_[a-z0-9\_]*/i,
        primaryFocusFilename: "focus.primary",
        forAdsFound: [(file) => {
            var sizeMatch = file.name.match(/[0-9]*x[0-9]*/) || [""];
            var sizeSplit = sizeMatch[0].split("x");
            if(sizeSplit.length!=2) return;
            file.width = sizeSplit[0] | 0;
            file.height = sizeSplit[1] | 0;
            file.borderWidth = file.width-2;
            file.borderHeight = file.height-2;
        }],

        monitor: {
            enabled: false,
            delay: 2000
        },
    },
    
    modules: { wrapper: false, definition: false },
    overrides: {
        production: {
            optimize: false,
            plugins: {
                uglify: {
                mangle: true,
                dead_code: true,
                sequences: true,
                properties: true,
                conditionals: true,
                compress: { global_defs: { DEBUG: false }, hoist_vars: true }}
            }
        }
    },
    
    sourceMaps: false,
    plugins: {
        less: { enabled: true, modules: false },
        autoReload: {
            enabled: true,
            exposeSendMessage: function(func) {
                global.sendMessage = func;
            },
            match: {
                stylesheets: '**/*.css',
                javascripts: '**/*.js'
            }
        }
    },
    
    files: {
        javascripts: {},
        stylesheets: {},
        templates: {},
    }
};