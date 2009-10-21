//// "lib"
/// This installs a centralized set of javascript modules under
/// the "lib" namespace.

(function() {

    function LibException(msg) {
        this.msg = msg;
        this.toString = function() {
            return this.msg;
        };
    }

    function make_secure(url) {
        var current_url = document.location.href;
        if(current_url.substring(0, 5) == 'https') {
            return url.replace(/[^:]*:\/\//, 'https://')
        }
        return url;
    }

    if(!window.__jmod_lib_url__) {            
        window.__jmod_lib_url__ = make_secure('http://js.thisismedium.com/lib/');
    }
    else {
        window.__jmod_lib_url__ = make_secure(window.__jmod_lib_url__);
    }

    // The `lib' namespace dispatches requests for modules off to the
    // centralized repository
    jMod.internal.make_namespace('lib', function(names, block) {
	    for(var i=0; i<names.length; i++) {
            var name = names[i];

            // Strip "lib" off the module name
	        var file = name.substr(name.indexOf('.')+1);
            var version = jMod.internal.get_version(name);

            if(!version) {
                throw new LibException(
                    "Version error: " + name +
                    " (couldn't find version, and modules from " +
                    "\"lib\" require versions. See `jMod.init'"
                );
            }

            file += "-" + version + '.js';
	        jMod.internal.request(names[i],
                                  make_secure(window.__jmod_lib_url__) + file,
                                  block);
	    }
    });

})();
