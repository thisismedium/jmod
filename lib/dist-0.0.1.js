//
// Installs the centralized distribution
// @version 0.0.1
//

(function() {

    function DistributionException(msg) {
	this.msg = msg;
    }

    DistributionException.prototype.toString = function() {
	return this.msg;
    }

    if(!window.__dist_version__) {
	throw DistributionException("__dist_version__ is undefined, please define it " +
				    "(are you supposed to be including a bootloader?)");
    }

    if(!window.__dist_url__) {
	window.__dist_url__ = 'http://js.coptix.com/';
    }
    
    // Create the LIB namespace which dispatches requests for
    // modules off to the centralized repository
    Modules.set_namespace_handler('lib', function(names) {
	dist_url = window.__dist_url__.replace(/\/*$/, "");
	for(var i=0; i<names.length; i++) {
	    var file = names[i].substr(names[i].indexOf('.')+1) + '.js';
	    Modules.request(names[i],
			    dist_url + "/" + window.__dist_version__,
			    file);
	}
    });

})();
