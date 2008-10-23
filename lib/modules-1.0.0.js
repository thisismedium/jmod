//
// modules.js -- modules for javascript
// James Long 10/17/2008
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
    JS_URL = '/';

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

	request_modules(imps);
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
    function request_modules(names) {
	var rest = request_namespaces(names);
	each(rest, function(i, name) {
	    if(!is_requested(name))
		request(name);
	});
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

    // A module is in one of three states:
    //
    // 1. requested - a request for a module has been
    //       made, but nothing is available yet
    // 2. registered - a module object exists but its
    //       exported symbols may not be available yet
    // 3. loaded - the module has been executed and its
    //       exported symbols are available for use
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

    REQUESTED = {};
    MODULES = {};
    DEPENDENCY_GRAPH = {};

    // Request the javascript file containing
    // the module over HTTP
    function request(name, base, file) {
	if(REQUESTED[name])
	    throw new ModuleException("Module '" + name +
				      "' has already been requested.");

	get_script(join_paths(base || JS_URL,
			      file || name_to_path(name)));
	REQUESTED[name] = true;
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
	
	MODULES[name] = module;
	DEPENDENCY_GRAPH[name] = imports;

	if(imports.length == 0) {
	    load(module);
	    while(on_loaded(module)) {}
	}
    }
    
    // Execute the module's code and inject the exported
    // object into the appropriate namespace
    function load(module) {
	var args = [];

	each(module.imports, function(i, name) {
	    args.push(object_from_top(name_to_identifier(name)));
	});

	var obj = new function() {
	    module.code.apply(this, args);
	}();

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
	return REQUESTED[name] || false;
    }

    function is_registered(name) {
	return MODULES[name] || false;
    }
    
    function is_loaded(name) {
	return MODULES[name].loaded || false;
    }
    
    // The hook that makes sure modules are loaded
    // in the right order.  It is fired off when any
    // module is loaded, and loads modules with all
    // dependencies met.
    function on_loaded(module) {
	var _continue = false;
	
	each(DEPENDENCY_GRAPH, function(name, deplist) {
	    if(!is_loaded(name)) {
		var ready = true;
		each(deplist, function(i, name) {
		    if(!is_loaded(name))
			ready = false;
		});
		if(ready) {
		    load(lookup(name));
		    _continue = true;
		    return false;
		}
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
	
	set_modules_path: function(path) {
	    JS_URL = path;
	}
    };


    // -----------------------
    // Util
    // -----------------------
    
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

})();
