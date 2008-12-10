//
// lib.introspection -- functions to introspecting
// the distribution and modules
// @version 0.0.1
//

module('lib.introspection',
       imports('lib.exceptions'),
       function(ex) {
	   // current_dist_url -- returns the current
	   // distribution's url
	   this.current_dist_url = function() {
	       if(!window.__dist_url__)
		   throw new ex.Exception("Cannot find distribution url! " +
					  "(have you called " +
					  "Distribution.load(...)?)");
	       return window.__dist_url__;
	   };

	   // current_dist_version -- returns the current
	   // distribution's version
	   this.current_dist_version = function() {
	       if(!window.__dist_version__)
	       	   throw new ex.Exception("Cannot find distribution version! " +
					  "(have you called "+
					  "Distribution.load(...)?)");
	       return window.__dist_version__;
	   };

	   // caller_module -- returns the module in which
	   // the call to this function originated from
	   this.caller_module = function() {
	       var func = arguments.callee.caller;
	       var module = null;
	       
	       while(func) {
		   if(func.module) {
		       module = func.module;
		       break;
		   }
		   func = func.caller;
	       }

	       if(!module) {
		   throw new ex.Exception("Unable to find caller " +
					  "module");
	       }

	       return module;
	   };
       });
