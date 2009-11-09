//// jmod -- modules for javascript
/// James Long 6/10/2009
/// @version 1.0.0
///
/// This library provides a pretty syntax for
/// encapsulating javascript code and manages dependencies
/// between libraries.
///
/// It essentially makes it easier to write:
///
/// (function($j) {
///   ...
///   window.foo.fizzle = ...
/// })(jQuery);
///
/// The above is not very readable.  It's also bulky to
/// export symbols.  This library makes it easier to define
/// the above module.  Here's how it would look:
///
/// module('james.foo',
///        imports('lib.jquery'),
///        function($j) {
///            ...
///            this.fizzle = ...
///        });
///
/// The first argument is the name of the module,
/// the second is a list of imports, and the third
/// is the code.  The list of imports is constructed
/// with the IMPORTS command, which takes a list of
/// module names.  Imported modules are passed as function
/// arguments to this module.
///
/// The module function is evaluated in the context
/// of the module object, referred to by THIS.  To export
/// functions and variables, simply add them to the THIS object.
///
/// Modules are included only once, and in the right order to
/// satify dependency requirements.  Circular dependencies are not
/// supported.
///

(function() {

    //// Util

    function ModuleException(msg) {
        this.msg = msg;
        this.toString = function() {
            return this.msg;
        };
    }

    //// Config

    JS_URL = '/js'; // Default search path

    function config(opts) {
        opts = opts || {};
        if(opts.debug)
            debug(opts.debug);
        if(opts.path)
            set_path(opts.path);
        if(opts.force_versions)
            force_versions(opts.force_versions);
        if(opts.versions)
            add_versions(opts.versions);
    }

    function set_path(path) {
        JS_URL = path;
    }

    function debug(flag) {
        window.__debug__ = !!flag;
        return window.__debug__;
    }

    //// Public module statements

    function module(name, imps, code) {
        if(imps instanceof Function) {
            code = imps;
            imps = imports();
        }

        register(make_module(name, imps, code));
    }

    function imports() {
        return arguments_to_array(arguments);
    }

    function thunk(imps, code) {
        module(gensym(), imps, code);
    }

    //// Internal module helpers

    function make_module(name, imps, code) {
        obj = {
            name: name,
            imports: imps,
            code: code,
            version: get_version(name)
        };

        // For introspection, link the module instance with its code
        obj.code.module = obj;

        return obj;
    }

    // Request a list of modules asynchronously
    function request_modules() {
        modules = arguments_to_array(arguments);
        var rest = namespace_dispatch(modules);
        each(rest, function(i, name) {
            request(name);
        });
    }

    function include_modules() {
        modules = arguments_to_array(arguments);
        var rest = namespace_dispatch(modules, true);
        each(rest, function(i, name) {
            request(name, null, true);
        });
    }
    
    //// Versioning

    VERSIONS = {};
    USE_VERSIONS = false;

    function add_versions(data) {
        for(var name in data) {
            VERSIONS[name] = data[name];
        }
    }

    function force_versions(flag) {
        USE_VERSIONS = !!flag;
        return USE_VERSIONS;
    }

    function get_version(name) {
        return VERSIONS[name] || false;
    }

    //// URL and filename resolution

    function resolve_filename(name) {
        var version = get_version(name);
        var path = name.replace(/\./g, '/');

        if(force_versions() && !version) {
            throw new ModuleException(
                "Could not find version for " + name +
                "; versions are required.  See `jMod.init'"
            );
        }
        else if(version) {
            path += '-' + version;
        }

        path += '.js';
        return path;
    }

    function resolve_url(name) {
        return join_paths(JS_URL, resolve_filename(name));
    }

    //// Namespacing

    // Top-level namespaces can have different behaviours;
    // maybe the module should be found in a different location,
    // or the file name resolving should happen differently.
    // You can register namespace handlers, so that registering
    // for "foo" would intend to capture all modules with a
    // a name like foo.*.  There are two types of "handlers":
    //
    // String - signifies a different location for the modules
    // Function - a handler which receives a list of the modules
    //            it should handle.  It is responsible for requesting
    //            all of these modules.

    NAMESPACES = {};

    function make_namespace(name, handler) {
        NAMESPACES[name] = handler;
    }

    function namespace_dispatch(names, block) {
        var unprocessed = [];
        names = remove_requested(names);

        each(group_by_namespace(names),
             function(namespace, names) {
                 if((handler = NAMESPACES[namespace])) {
                     if(typeof(handler) == "string") {
                         default_handler(handler, names, block);
                     }
                     else {
                         handler(names, block);
                     }
                 }
                 else {
                     unprocessed = unprocessed.concat(names);
                 }
             });
        return unprocessed;
    }

    // The default handler takes a string registered with the
    // namespace as the base url, and requests all the modules
    // from that url.
    function default_handler(base, names, block) {
        each(names, function(i, name) {
            // It's important to note that we are registering the
            // module with its full name (includes the namespace)
            var url = join_paths(base,
                          resolve_filename(strip_namespace(name)));
            request(name, url, block);
        });
    }

    function group_by_namespace(names) {
        var grouped = {};
        each(names, function(i, name) {
            var prefix = name.split('.')[0];
            if(!grouped[prefix])
                grouped[prefix] = [];
            grouped[prefix].push(name);
        });
        return grouped;
    }

    function remove_requested(names) {
        var rest = [];
        each(names, function(i, name) {
            if(!is_requested(name))
                rest.push(name);
        });
        return rest;
    }

    function strip_namespace(name) {
        return name.substring(name.indexOf('.')+1);
    }

    //// Core

    // A module is in one of four states:
    //
    // 1. requested - a request for a module has been
    //       made, but nothing is available yet
    // 2. registered - a module object exists but its
    //       exported symbols may not be available yet
    // 3. loaded - the module has been executed and its
    //       exported symbols are available for use
    // 4. errored - the module is loaded but an error
    //       occurred while loading
    //
    // The "requested" stage was added to fix a dependency
    // loading issue:
    //
    // A -> B,C,D
    // B -> C,E
    //
    // If we had a dependency scenario like the above,
    // A would pull in B, C, and D, but because C isn't
    // registered by the time B is requested, B would also pull in C.
    //
    // When a module is registered, if all of its dependencies
    // are loaded, it is loaded.  Otherwise, it is not loaded.
    //
    // When a module is loaded, it traverses through the dependency
    // graph for all modules with dependencies met, and loads them.
    //
    // An error may occur when a module is loaded, such as syntax
    // or some global action goes wrong.  When this happens, the
    // module is marked as errored and the exception is re-thrown.

    REQUESTED = {};
    MODULES = {};
    DEPENDENCY_GRAPH = {};

    ///// Actions

    // Low-level mechanism for requesting the modules' javascript file
    // over HTTP
    function request(name, url, blocking) {
        if(!is_requested(name)) {
            url = url || resolve_url(name);
            
            if(blocking) {
                get_script_blocking(url);
            }
            else {
                // We must wait because browsers tend to ignore
                // dynamic script tags if appended too early
                onReady(function() {
                    get_script(url);
                });
            }
            REQUESTED[name] = blocking ? 'sync' : 'async';
        }
    }

    // Register the module internally and augment the dependency graph
    function register(module) {
        var name = module.name;
        var imports = module.imports;

        if(is_registered(name)) {
            throw new ModuleException("Module '" + name +
                                      "' is already registered.");
        }

        module.loaded = false;
        module.errored = false;
        MODULES[name] = module;
        DEPENDENCY_GRAPH[name] = imports;

        if(are_deps_loaded(module.name)) {
            load(module);
            while(on_loaded()) {}
        }
        else {
            if(is_asynchronous(name)) {
                request_modules.apply(this, module.imports);
            }
            else {
                include_modules.apply(this, module.imports);
            }
        }
    }

    // Execute the module's code and publish the module
    function load(module) {
        var args = [];
        var obj;

        each(module.imports, function(i, name) {
            args.push(lookup(name).obj);
        });

        try {
            obj = new function() {
                return module.code.apply(this, args);
            };
        }
        catch(e) {
            module.errored = true;
            obj = {};
            throw e;
        }

        publish_module(module, obj);
        module.obj = obj;
        module.loaded = true;
    }

    // Querying modules and their states
    function lookup(name) {
        return MODULES[name];
    }

    function is_requested(name) {
        return !!REQUESTED[name];
    }

    function is_asynchronous(name) {
        return REQUESTED[name] && REQUESTED[name] == 'async';
    }
    
    function is_registered(name) {
        return MODULES[name] || false;
    }

    function is_loaded(name) {
        return !!(MODULES[name] && MODULES[name].loaded);
    }

    function is_errored(name) {
        return !!(MODULES[name] && MODULES[name].errored);
    }

    ///// Dependencies loading

    function are_deps_loaded(name) {
        var ready = true;
        each(DEPENDENCY_GRAPH[name], function(i, name) {
            if(!is_loaded(name) || is_errored(name))
                ready = false;
        });
        return ready;
    }

    // The hook that makes sure modules are loaded
    // in the right order.  It is fired off when any
    // module is loaded, and loads modules with all
    // dependencies met.
    function on_loaded() {
        var _continue = false;

        each(MODULES, function(name, mod) {
            if(!is_loaded(name) && are_deps_loaded(name)) {
                load(lookup(name));
                _continue = true;
                return false;
            }
        });

        return _continue;
    }

    //// Public interface

    window.module = module;
    window.imports = imports;
    window.thunk = thunk;

    window.jMod = {
        internal: {
            request: request,
            make_namespace: make_namespace,
            get_version: get_version,
            add_versions: add_versions
        },

        config: config,
        load: request_modules,
        include: include_modules,
        ready: onReady
    };

    function publish_module(name, obj) {
        window.jMod[name] = obj;
    }

    //// Debugging interface

    (function() {
        var __queue = null;

        function output(msg) {
            if(window.console && console.log) {
                console.log(msg);
            }
        }

        function queue(msg) {
            __queue = msg;
        }

        function flush(msg) {
            if(__queue) {
                output(__queue);
                __queue = null;
            }

            output(msg);
        }

        // Give the developer a warning about incomplete
        // modules after 5 seconds
        setTimeout(function() {
            if(window.__debug__) {
                queue("WARNING: The following modules could not be found:");
                each(REQUESTED, function(name) {
                    if(!is_registered(name)) {
                        flush(name);
                    }
                });

                queue("WARNING: The following dependencies were never met");
                each(MODULES, function(name, mod) {
                    if(!is_loaded(name)) {
                        flush(name + " -> " +
                              DEPENDENCY_GRAPH[name].join(", "));
                    }
                });
            }
        }, 5000);
    })();


    //// Util

    // Converts the native arguments object into a javascript array
    function arguments_to_array(a) {
        if(!(a instanceof Array))
            return Array.prototype.slice.call(a);
        return a;
    }

    // Smart path joining that avoids duplicate slashes
    function join_paths() {
        var args = arguments_to_array(arguments);
        var path = args.shift();

        each(args, function(k, v) {
            path = path.replace(/\/*$/, '');
            v = v.replace(/^\/*/, '/');

            path += v;
        });

        return path;
    }

    var symcount = 0;

    function gensym() {
        return 'o' + symcount++;
    }

    function get_script_blocking(url) {
        document.write('\x3Cscript src="' + url + '">\x3C/script>');
    }
    
    // Evaluates a remote script by adding a <script> tag to
    // the document.  Stolen from jquery 1.2.6.
    function get_script(url) {
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.src = url;

        var done = false;

        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function() {
            if ( !done && (!this.readyState ||
                           this.readyState == "loaded" ||
                           this.readyState == "complete") ) {
                done = true;
                head.removeChild( script );
            }
        };

        head.appendChild(script);

        // We handle everything using the script element injection
        return undefined;
    }

    // Apply a function to each element in an object. Stolen from
    // jquery 1.2.6.
    function each(object, callback) {
        var name, i = 0, length = object.length;
        if ( length == undefined ) {
            for ( name in object )
                if ( callback.call( object[ name ],
                                    name,
                                    object[ name ] ) === false )
                    break;
        } else
            for ( var value = object[0];
                  i < length &&
                  callback.call( value, i, value ) !== false;
                  value = object[++i] ){}

        return object;
    }

    //// Events (stolen from jquery 1.3.1)

    ///// onReady
    // We need to provide a "ready" event since this javascript is
    // the only code guaranteed to run before the browser's event is
    // fired off.  This was a problem when jQuery was far down in
    // the dependency tree, and was sometimes loaded after the event
    // was fired.

    var isReady = false;
    var readyBound = false;
    var readyQueue = [];

    function onReady(f) {
        if(isReady) {
            f();
        }
        else {
            bindReady();
            readyQueue.push(f);
        }
    }

    function runReady() {
        isReady = true;
        each(readyQueue, function(i, f) {
            f();
        });
    }

    function bindReady(){
	    if(readyBound) return;
	    readyBound = true;

	    // Mozilla, Opera and webkit nightlies currently support this event
	    if ( document.addEventListener ) {
		    // Use the handy event callback
		    document.addEventListener( "DOMContentLoaded", function(){
			    document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
                runReady();
		    }, false );

	        // If IE event model is used
	    } else if ( document.attachEvent ) {
		    // ensure firing before onload,
		    // maybe late but safe also for iframes
		    document.attachEvent("onreadystatechange", function(){
			    if ( document.readyState === "complete" ) {
				    document.detachEvent( "onreadystatechange", arguments.callee );
                    runReady();
			    }
		    });

		    // If IE and not an iframe
		    // continually check to see if the document is ready
		    if ( document.documentElement.doScroll && typeof window.frameElement === "undefined" )
                (function(){
			        if(isReady) return;
			        try {
				        // If IE is used, use the trick by Diego Perini
				        // http://javascript.nwbox.com/IEContentLoaded/
				        document.documentElement.doScroll("left");
			        } catch( error ) {
				        setTimeout( arguments.callee, 0 );
				        return;
			        }
			        // and execute any waiting functions
                    runReady();
		        })();
	    }
        else {
            // A fallback to window.onload, that will always work
            onLoad(runReady);
        }
    }

    //// onLoad

    var isLoaded = false;
    var loadBound = false;
    var loadQueue = [];

    function onLoad(f) {
        if(isLoaded)
            f();
        else {
            bindLoad();
            loadQueue.push(f);
        }
    }

    function runLoad() {
        isLoaded = true;
        each(loadQueue, function(i, f) {
            f();
        });
    }

    function bindLoad() {
        if(loadBound) return;
        loadBound = true;

        var prev = window.onload;
        window.onload = function() {
            if(prev) prev();
            runLoad();
        };
    }

})();
