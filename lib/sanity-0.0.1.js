/*
 * Sanity -- a javascript unit testing library
 * James Long 10/14/2008
 * @version 0.0.1
 */

module('lib.sanity',
       function() {
	   // Keep track of the status of the tests. If one
	   // has failed, we don't run any other tests.
	   var hasFailed = false;

	   // The type of assertion object thrown
	   function assertionException(type, msg, stack) {
	       this.type = type;
	       this.msg = msg;
	       this.stack = stack;
	   }

	   assertionException.prototype.toString = function() {
	       return "ERROR " + this.type + " -> " + this.msg +
		   " ->\n" + this.stack.join("\n");
	   }

	   // Indicate a failure by throwing an exception explaining the
	   // type of assertion error, any user-provided
	   // custom message, and the stack (if available).
	   function failure(type, msg) {
	       if(hasFailed) return;
	       hasFailed = true;
	       throw new assertionException(type, msg, stackTrace());
	   }

	   // All types of assertions
	   function assert(v, msg) {
	       if(!v) {
		   failure(arguments.callee.name,
			   msg || toRepr(v) + ' is false');
	       }
	   }
	   
	   function assertEqual(first, second, msg) {
	       var v = equal(first, second);
	       if(!v) {
		   failure(arguments.callee.name,
			   msg || (toRepr(first) + ' != ' + toRepr(second)));
	       }
	   }

	   function assertNotEqual(first, second, msg) {
	       if(!equal(first, second,
			 function(a,b) { return a!=b; })) {
    		   failure(arguments.callee.name,
			   msg || (toRepr(first) + ' == ' + toRepr(second)));
	       }
	   }

	   function assertAlmostEqual(first, second, places, msg) {
	       if(!almostEqual(first, second, places || 7)) {
		   failure(arguments.callee.name,
			   msg ||
			   (toRepr(first) + ' != ' + toRepr(second) +
			    'within ' + places + ' places'));
	       }
	   }

	   function assertNotAlmostEqual(first, second, places, msg) {
	       if(almostEqual(first, second, places || 7)) {
		   failure(arguments.callee.name,
			   msg ||
			   (toRepr(first) + ' == ' + toRepr(second) +
			    'within ' + places + ' places'));
	       }
	   }

	   function assertRaises(exc, f, msg) {
	       var args = argumentsToArray(arguments)
	       args.shift; args.shift;

	       try {
		   f.apply(null, args);
	       }
	       catch(e if !equal(e, exc)) {
		   failure(arguments.callee.name,
			   msg ||
			   toRepr(e) + ' raised instead of ' + toRepr(exc));
	       }

	       failure(arguments.callee.name,
		       msg || toRepr(exc) + ' not raised');
	   }

	   // Export these functions
	   
	   this.assert = assert;
	   this.assertEqual = assertEqual;
	   this.assertNotEqual = assertNotEqual;
	   this.assertAlmostEqual = assertAlmostEqual;
	   this.assertNotAlmostEqual = assertNotAlmostEqual;
	   this.assertRaises = assertRaises;
	   
	   // ---------------------
	   // Utility
	   // ---------------------
	   
	   // This is a hack to import symbols into
	   // a function's namespace.
	   function apply_with_environment(f, env, _this, args) {
	       var scrub = [];
	       for(var k in env) {
		   if(window[k] === undefined) {
		       scrub.push(k);
		       window[k] = env[k];
		   }
	       }

	       try {	    
		   return f.apply(_this, args);
	       }
	       finally {
		   for(var i=0; i<scrub.length; i++) {
		       window[scrub[i]] = undefined;
		   }
	       }
	   }

	   // Same as apply_with_environment, but constructs
	   // the arguments from the actual parameters
	   function call_with_environment(f, env, _this) {
	       var args = argumentsToArray(arguments);
	       args.shift; args.shift;
	       return apply_with_environment(f, env, _this, args);
	   }    

	   function stackTrace() {
	       stack = [];
	       
	       try {
		   throw new Error();
	       }
	       catch(e) {
		   var exc_stack = e.stack.split('\n');
		   exc_stack.shift();
		   stack = exc_stack;
	       }

	       return stack;
	   }

	   // Converts the native arguments object
	   // into a javascript array
	   function argumentsToArray(a) {
	       if(!(a instanceof Array))
		   return Array.prototype.slice.call(a);
	       return a;
	   }
	   
	   // Like toString, but treats objects better
	   function toRepr(obj) {
	       if(isType(obj, Object)) {
		   return obj.toSource();
	       }
	       return obj.toString();
	   }

	   // Make the syntax for INSTANCEOF prettier
	   function isType(obj, type) {
	       return (obj instanceof type);
	   }

	   // Return the keys of a hash
	   function keys(obj) {
	       var lst = [];
	       for(var i in obj)
		   lst.push(i);
	       return lst;
	   }

	   // Recursively compares objects and returns
	   // true if the comparison function returns
	   // true for all elements
	   function equal(first, second, comp) {
	       comp = comp || function(a,b) { return a==b; };
	       
	       if(isType(first, Object) && isType(second, Object)) {
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
	   function almostEqual(first, second, places) {
	       var factor = Math.pow(10, places);
	       return Math.round((second-first)*factor)/factor == 0;
	   }

       });





//       window.onerror = function(e, d, l) {
// 	  alert(e);
// 	  alert(d);
// 	  alert(l);
//       };
// jQuery.getScript('http://static.ak.fbcdn.net/rsrc.php/z8NHA/pkg/102/126093/js/common.js.pkg.php');
