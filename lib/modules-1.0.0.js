//
// modules.js -- modules for javascript
// James Long 10/17/2008
// @version 1.0.0
//
// This library provides a pretty syntax for
// encapsulating javascript code and manages dependencies
// between libraries.
//
// It essentially makes it easier to write:
//
// (function($j) {
//   ...
//   window.foo.fizzle = ...
// })(jQuery);
//
// The above is not very readable.  It's also bulky to
// export symbols.  This library makes it easier to define
// the above module.  Here's how it would look:
//
// module('james.foo',
//        imports('lib.jquery'),
//        function($j) {
//            ...
//            this.fizzle = ...
//        });
//
// The first argument is the name of the module,
// the second is a list of imports, and the third
// is the code.  The list of imports is constructed
// with the IMPORTS command, which takes a list of
// module names.  Imported modules are passed as function
// arguments to this module.
//
// The module function is evaluated in the context
// of the module object, referred to by THIS.  To export
// functions and variables, simply add them to the THIS object.
//
// Modules are included only once, and in the right order to
// satify dependency requirements.  Circular dependencies are not
// supported.
//

(function() {

    // Default search path
    JS_URL = '/js';

    // The type of exception thrown by this library
    function ModuleException(msg) {
	this.msg = msg;
    }

    ModuleException.prototype.toString = function() {
	return this.msg;
    }
    
    // Stating dependencies    
    function imports() {
	return arguments_to_array(arguments);
    }
    
    // The entry point for creating a module. Example:
    //    module("foo",
    //           imports("lib.jQuery",
    //                   "lib.bar",
    //                   "lib.wiggle"),
    //           function($j) { ... });
    function module(name, imps, code) {
	if(imps instanceof Function) {
	    code = imps;
	    imps = imports();
	}

	request_modules.apply(this, imps);
	register(make_module(name, imps, code));
    }

    function make_module(name, imps, code) {
	return { name: name,
		 imports: imps,
		 code: code };
    }

    // Extract the name and version out of a module's
    // encoded name
    function extract_version(name) {
	var m = name.match(/(.*)-(\d+\.\d+\.\d+)/);
	if(m) {
	    return { name: m[1],
		     version: m[2] };
	}

	return { name: name,
		 version: null };
    }
    
    // Requests several modules at once, and lets any
    // custom namespace handling occur
    function request_modules() {
	var names = arguments_to_array(arguments);
	var rest = request_namespaces(names);
	each(rest, function(i, name) { request(name); });
    }

    // Converts a module's name into a valid javascript
    // identifier
    function name_to_identifier(name) {
	var info = extract_version(name);
	if(info.version)
	    return info.name + '_' + info.version.replace(/\./g, '_');
	return info.name;
    }
    
    // Converts a module name into a URL
    function name_to_path(name) {
	var parts = extract_version(name);

	name = parts.name.replace(/\./g, '/');
	if(parts.version)
	    name += '-' + parts.version;
	name += '.js';
	return name;
    }
    
    // Custom namespace handling enables applications
    // to add special behaviour for looking up modules.
    // You register a namespace, and any module beginning
    // with that namespace is handed off to you for
    // retrieving the appropriate javascript file(s).
    NAMESPACES = {};

    function register_namespace(name, path_transformer) {
	NAMESPACES[name] = path_transformer;
    }

    function request_namespaces(names) {
	var grouped = {};
	var unprocessed = [];

	// Group the modules that have a custom handler
	// by the first namespace
	each(names, function(i, name) {
	    if(!is_requested(name)) {
		var parts = name.split('.');
		var prefix = parts[0];

		if(NAMESPACES[prefix]) {
		    if(!grouped[prefix])
			grouped[prefix] = [];
		    grouped[prefix].push(parts.join('.'));
		}
		else {
		    unprocessed.push(name);
		}
	    }
	});

	each(grouped, function(prefix, names) {
	    NAMESPACES[prefix](names);
	});
	
	return unprocessed;
    }

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
    // registered when B is loaded, B would also pull in C.
    //
    // When a module is registered, if all of its dependencies
    // are loaded, it is loaded.  Otherwise, it is not loaded.
    //
    // When a module is loaded, it traverses through the dependency
    // graph for all modules with dependencies met, and loads them.
    //
    // An error may occur when a module is loaded, such as syntax
    // or some global action goes wrong.  When this happens, the
    // module is marked as errored.
    
    REQUESTED = {};
    MODULES = {};
    DEPENDENCY_GRAPH = {};
    
    // Request the javascript file containing
    // the module over HTTP
    function request(name, base, file) {
	if(!REQUESTED[name]) {
	    // Wait until the DOM is ready because of nasty
	    // bugs in seemingly most browsers with timing issues
	    // of appending SCRIPT tags this early on
	    onReady(function() {
		get_script(join_paths(base || JS_URL,
				      file || name_to_path(name)));
	    });
	    REQUESTED[name] = true;
	}
    }
    
    // Register the module internally and
    // augment the dependency graph
    function register(module) {
	var name = module.name;
	var imports = module.imports;

	if(MODULES[name]) {
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
    }
    
    // Execute the module's code and inject the exported
    // object into the appropriate namespace
    function load(module) {
	var args = [];
	var obj;

	each(module.imports, function(i, name) {
	    args.push(object_from_top(name_to_identifier(name)));
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

	set_module_object(module, obj);
	module.loaded = true;
    }

    // Performs the injection of a module object into
    // a namespace according to the module's name
    function set_module_object(module, obj) {
	var full_name = module.name;
	var bare_name = extract_version(full_name).name;
	var parent;
	var name;
	var split;

	// We want to traverse down the object tree
	// and find where this module object should go.
	// We need to find it's parent object and shove it
	// in as a property (FOO.UTIL will shove the `util`
	// property into `foo`.)
	if((split = bare_name.lastIndexOf('.')) != -1) {
	    name = full_name.substr(split+1);
	    parent = object_from_top(full_name.substr(0, split),
				     true);
	}
	else {
	    name = full_name;
	    parent = window;
	}

	name = name_to_identifier(name);

	if(parent[name]) {
	    throw new ModuleException("Module '" + module.name +
				      "' is already loaded.");
	}
	parent[name] = obj;
    }

    // Querying modules and their states
    function lookup(name) {
	return MODULES[name];
    }
    
    function is_requested(name) {
	return (REQUESTED[name] && REQUESTED[name]) || false;
    }

    function is_registered(name) {
	return (MODULES[name] && MODULES[name]) || false;
    }
    
    function is_loaded(name) {
	return (MODULES[name] && MODULES[name].loaded) || false;
    }

    function is_errored(name) {
	return (MODULES[name] && MODULES[name].errored) || false;
    }

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
    
    // ------------------------
    // Public interface
    // ------------------------
    
    window.module = module;
    window.imports = imports;

    window.Modules = {
	register_namespace: register_namespace,
	load_module: request,
	load_modules: request_modules,
	
	set_modules_path: function(path) {
	    JS_URL = path;
	}
    };

    if(window.__debug__) {
	function output(msg) {
	    if(console && console.log) {
		console.log(msg);
	    }
	}
	
	// Give the developer a warning about incomplete
	// modules after 5 seconds
	setTimeout(function() {
	    var __queue = null;
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
	    
	    queue("WARNING: The following modules could not be found:");
	    each(REQUESTED, function(name) {
		if(!is_registered(name)) {
		    flush(name);
		}
	    });
		
	    queue("WARNING: The following dependencies were never met");
	    each(MODULES, function(name, mod) {
		if(!is_loaded(name)) {
		    flush(name);
		}
	    });
	}, 5000);
    }
    

    // -------------------------------
    // Util
    // -------------------------------
    
    // Converts the native arguments object
    // into a javascript array
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

    // Looks up an object referenced by parent
    // objects (or, a cheap evaluator for the
    // expression "foo.bar.wiggle").
    function object_from_top(name, soft) {
	var parts = name.split('.');
	var top = window;
	each(parts, function(i, part) {
	    if(top[part]) {
		top = top[part];
	    }
	    else {
		if(!soft) {
		    throw new ModuleException("Failed looking " +
					      "up '" + name +
					      "': " + part + 
					      " does not exist.");
		}
		top[part] = new Object();
		top = top[part];
	    }
	});
	return top;
    }
    
    // Evaluates a remote script by adding a <script>
    // tag to the document.  Stolen from jquery 1.2.6.
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

    // Apply a function to each element in an
    // object.  Stolen from jquery 1.2.6.
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

    // -------------------------------------
    // Events (stolen from jquery 1.2.6)
    // -------------------------------------

    var userAgent = navigator.userAgent.toLowerCase();
    
    browser = {
	version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
	safari: /webkit/.test( userAgent ),
	opera: /opera/.test( userAgent ),
	msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
	mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent )
    };

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
    
    function bindReady() {
	if ( readyBound ) return;
	readyBound = true;

	// Mozilla, Opera (see further below for it) and webkit nightlies currently support this event
	if ( document.addEventListener && !browser.opera)
	    // Use the handy event callback
	    document.addEventListener( "DOMContentLoaded", runReady, false );

	// If IE is used and is not in a frame
	// Continually check to see if the document is ready
	else if ( browser.msie && window == top ) (function(){
	    if (isReady) return;
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

	else if ( browser.opera )
	    document.addEventListener( "DOMContentLoaded", function () {
		if (isReady) return;
		for (var i = 0; i < document.styleSheets.length; i++)
		    if (document.styleSheets[i].disabled) {
			setTimeout( arguments.callee, 0 );
			return;
		    }
		// and execute any waiting functions
		runReady();
	    }, false);

	else if ( browser.safari ) {
	    var numStyles;
	    (function(){
		if (isReady) return;
		if ( document.readyState != "loaded" && document.readyState != "complete" ) {
		    setTimeout( arguments.callee, 0 );
		    return;
		}
		if ( numStyles === undefined ) {
		    numStyles = 0;
		    each(document.getElementsByTagName('style'), function(i, el) {
			numStyles++;
		    });
		    each(document.getElementsByTagName('link'), function(i, el) {
			if(el.rel == 'stylesheet')
			    numStyles++;
		    });
		}
		if ( document.styleSheets.length != numStyles ) {
		    setTimeout( arguments.callee, 0 );
		    return;
		}
		// and execute any waiting functions
		runReady();
	    })();
	}

	// A fallback to window.onload, that will always work
	else onLoad(runReady);
    }

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
	}
    }

})();
