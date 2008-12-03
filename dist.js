
(function() {

    function ResourceException(name, msg) {
	this.msg = msg;
	this.toString = function() {
	    return this.name + ": " + this.msg;
	}
    }

    window.Distribution = {
	load: function(version, base) {
	    base = base || 'http://js.coptix.com/';
	    if(base.charAt(base.length-1) != '/')
		base += '/';
	    
	    function file(name) {
		return base + version + "/" + name + ".js";
	    }

	    window.__dist_version__ = version;
	    window.__dist_url__ = base;
	    
	    document.write('<script type="text/javascript" ' +
			   'src="' + file('modules') + '"></script>');
	    document.write('<script type="text/javascript" ' +
			   'src="' + file('dist') + '"></script>');
	},

	get_resource: function(name) {
	    if(!__dist_url__ || !__dist_version__) {
		throw ResourceException(name,
					"No information about the" +
					"distribution available! " +
					"(have you called " +
					"Distribution.load(...)?)");
	    }
	    
	    var module = arguments.callee.caller.module;
	    return __dist_url__ + __dist_version__ + "/" +
		module.name + "/" + name;
	},

	load_resource: function(name) {
	    url = Distribution.get_resource(name);
	    ext = url.substring(url.lastIndexOf('.')+1);
	    
	    switch(ext) {
	    case 'css':
		document.write('<link rel="stylesheet" href="' + url +
			       '" type="text/css" />');
		break;
	    default:
		throw ResourceException(name, "Method unknown for " +
					"loading this resource type");
	    }
	}
    };

})();
