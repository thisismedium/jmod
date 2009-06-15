//// "introspection"
/// functions for introspecting modules
///

module('lib.introspection',
       function() {

           function IntrospectionException(msg) {
               this.msg = msg;
               this.toString = function() {
                   return this.msg;
               };
           }

           function jmod_lib_url() {
               return window.__jmod_lib_url__;
           }

	       // caller_module -- returns the module in which the call to
	       // this function originated from
	       function caller_module() {
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
		           throw new IntrospectionException(
                       "Unable to find caller module"
                   );
	           }

	           return module;
	       };

           this.caller_module = caller_module;
           this.jmod_lib_url = jmod_lib_url;
       });
