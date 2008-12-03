
module('lib.introspection',
       function() {
	   this.current_dist_url = function() {
	       if(!window.__dist_url__)
		   raise "Cannot find distribution url! " +
		         "(have you called Distribution.load(...)?)";
	       return window.__dist_url__;
	   }

	   this.current_dist_version = function() {
	       if(!window.__dist_version__)
	       	   raise "Cannot find distribution version! " +
		         "(have you called Distribution.load(...)?)";
	       return window.__dist_version__;
	   }

	   this.caller_module = functions() {
	       var callee = arguments.callee.caller;
	       return callee.caller.module;
	   }
       });
