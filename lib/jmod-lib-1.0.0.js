//// "lib"
/// This installs a centralized set of javascript modules under
/// the "lib" namespace.

(function() {
    var base = "/js/dist-mirror/lib/";

    function LibException(msg) {
        this.msg = msg;
        this.toString = function() {
            return this.msg;
        };
    }

    // The `lib' namespace dispatches requests for modules off to the
    // centralized repository
    jMod.internal.make_namespace('lib', function(names) {
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
                                  base + file);
	    }
    });

})();
