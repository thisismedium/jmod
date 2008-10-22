
(function() {

    var version='1.0.0';

    function DistributionException(msg) {
	this.msg = msg;
    }

    DistributionException.prototype.toString = function() {
	return this.msg;
    }

    // Create the LIB namespace which dispatches requests for
    // modules off to the centralized repository
    Modules.register_namespace('lib', function(names) {
	for(var i=0; i<names.length; i++) {
	    Modules.load_module(names[i],
				'http://js.coptix.com/' + version,
				names[i]);
	}
    });
})();
