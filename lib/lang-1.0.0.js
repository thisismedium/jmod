/**
 * Extensions to the javascript language
 * @version 1.0.0
 */

modules('lib.util.lang',
	function() {
	    this.arguments_to_array = function(a) {
		if(!(a instanceof Array)) {
		    return Array.prototype.slice.call(a);
		}
		return a;
	    }
	});

