/*
 * Sanity -- a javascript unit testing library
 * James Long 10/14/2008
 * @version 0.0.1
 */

module('lib.sanity',
       function() {

           //// Util

	       // If a test has failed, we don't run any other tests.
	       var has_failed = false;

           // You can't call any assert outside of test mode within
           // the $s(function() { ... }) call.
           var test_mode = false;

	       function AssertionException(type, msg, stack) {
	           this.type = type;
	           this.msg = msg;
	           this.stack = stack;

               this.toString = function() {
                   return "ERROR: " + this.type + " -> " + this.msg +
		               " ->\n" + this.stack;
	           };
	       }

	       function failure(type, msg) {
	           if(has_failed) return;
	           has_failed = true;

               if(console && console.error) {
                   console.error("ERROR", type, msg, "\n", stack_trace());
               }
	       }

           //// Assertions

	       function assert(v, msg) {
	           if(!v) {
		           failure(arguments.callee.name,
			               msg || repr(v) + ' is false');
	           }
	       }

	       function assert_equal(first, second, msg) {
	           var v = equal(first, second);
	           if(!v) {
		           failure(arguments.callee.name,
			               msg || (repr(first) + ' != ' + repr(second)));
	           }
	       }

	       function assert_not_equal(first, second, msg) {
	           if(!equal(first, second,
			             function(a,b) { return a!=b; })) {
    		       failure(arguments.callee.name,
			               msg || (repr(first) + ' == ' + repr(second)));
	           }
	       }

           function assert_almost_equal(first, second, places, msg) {
	           if(!almost_equal(first, second, places || 7)) {
		           failure(arguments.callee.name,
			               msg ||
			               (repr(first) + ' != ' + repr(second) +
			                'within ' + places + ' places'));
	           }
	       }

	       function assert_not_almost_equal(first, second, places, msg) {
	           if(almostEqual(first, second, places || 7)) {
		           failure(arguments.callee.name,
			               msg ||
			               (repr(first) + ' == ' + repr(second) +
			                'within ' + places + ' places'));
	           }
	       }

	       function assert_raises(exc, f, msg) {
	           var args = arguments_to_array(arguments);
	           args.shift(); args.shift();

	           try {
		           f.apply(null, args);
	           }
	           catch(e) {
		           if(!equal(e, exc)) {
		               failure(arguments.callee.name,
			                   msg ||
			                   repr(e) + ' raised instead of ' + repr(exc));
		           }
		           return;
	           }

	           failure(arguments.callee.name,
		               msg || repr(exc) + ' not raised');
	       }

           //// Utility

	       function stack_trace() {
	           stack = [];
               var err = new Error();
               if(err.stack) {
                   var stack = err.stack.split("\n");
                   stack.shift();
                   return remove_sanity_frames(stack).join("\n");
	           }
	           return 'Stack trace unavailable';
	       }

           function remove_sanity_frames(stack) {
               var new_stack = [];
               for(var i=0; i<stack.length; i++) {
                   if(stack[i].indexOf('sanity.js') == -1)
                       new_stack.push(stack[i]);
               }
               return new_stack;
           }

           // This is copied from util to avoid circular dependencies
	       function arguments_to_array(a) {
	           if(!(a instanceof Array)) {
		           return Array.prototype.slice.call(a);
	           }
	           return a;
	       }

	       // Like toString, but treats objects better
	       function repr(obj) {
	           if((obj instanceof Object) && obj.toSource) {
	               return obj.toSource();
	           }
	           return obj ? obj.toString() : obj;
	       }

	       // Return the keys of a hash
	       function keys(obj) {
	           var lst = [];
	           for(var i in obj)
		           lst.push(i);
	           return lst;
	       }

	       // Recursively compares objects and returns true if the
	       // comparison function returns true for all elements
	       function equal(first, second, comp) {
	           comp = comp || function(a,b) { return a==b; };

	           if((first instanceof Object) && (second instanceof Object)) {
		           var firstLength = first.length || keys(first).length;
		           var secondLength = second.length || keys(second).length;
		           var longest = Math.max(firstLength, secondLength);

		           for(var i=0; i<longest; i++) {
		               // TODO: will hang on self-referencing
		               if(!equal(first[i], second[i]))
			               return false;
		           }
	           }
	           else {
		           if(!comp(first, second))
		               return false;
	           }

	           return true;
	       }

	       // Equates numbers with a fuzzy factor
	       function almost_equal(first, second, places) {
	           var factor = Math.pow(10, places);
	           return Math.round((second-first)*factor)/factor == 0;
	       }

           //// Public interface
           /// We return a function like jQuery does, so that the only
           /// way to use this library is to pass in a function of
           /// tests. This way, we can only run tests in debug mode.

           function guard(f) {
               return function() {
                   if(!test_mode) {
                       throw AssertionException("Bad assertion call, you must be in a sanity context!" +
                                       "Pass a function into sanity instead.");
                   }
                   f.apply(this, arguments_to_array(arguments));
               }
           }

           var _interface = function(suite) {
               if(window.__debug__) {
                   test_mode = true;
                   suite();
                   test_mode = false;
               }
           }

           _interface.assert = guard(assert);
	       _interface.assert_equal = guard(assert_equal);
	       _interface.assert_not_equal = guard(assert_not_equal);
	       _interface.assert_almost_equal = guard(assert_almost_equal);
	       _interface.assert_not_almost_equal = guard(assert_not_almost_equal);
	       _interface.assert_raises = guard(assert_raises);

           return _interface;
       });
