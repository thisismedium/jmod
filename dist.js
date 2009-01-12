//
// Installs the `lib' namespace which pulls
// the module from the central repository.
//
// This file is NOT copied per distribution,
// so any changes affect ALL sites.  This is done
// purposefully so that we can change any internal
// structure later on, but change this very
// carefully.
//
(function() {

    function DistributionException(msg) {
	this.msg = msg;
	this.toString = function() {
	    return this.msg;
	}
    }
    
    // Create the `lib' namespace which dispatches requests for
    // modules off to the centralized repository
    Modules.set_namespace_handler('lib', function(names) {
	if(!window.__dist_url__) {
	    throw new DistributionException("No distribution url found, " +
					    "check the distribution.");
	}

	if(!window.__dist_version__) {
	    throw new DistributionException("No distribution version " +
					    "found, check the " +
					    "distribution");
	}
	
	dist_url = window.__dist_url__.replace(/\/*$/, "");
	for(var i=0; i<names.length; i++) {
	    var file = names[i].substr(names[i].indexOf('.')+1) + '.js';
	    Modules.request(names[i],
			    dist_url + "/dist/" + window.__dist_version__,
			    file);
	}
    });

})();
