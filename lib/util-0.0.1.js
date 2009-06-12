//
// lib.util -- extensions to the javascript language
// @version 0.0.1
//

module('lib.util',
       imports('lib.sanity'),
       function($s) {
	       function arguments_to_array(a) {
	           if(!(a instanceof Array)) {
		           return Array.prototype.slice.call(a);
	           }
	           return a;
	       }

	       function join_paths() {
	           var args = arguments_to_array(arguments);
	           var path = args[0];

	           for(var i=1; i<args.length; i++) {
		           var v = args[i];
		           path = path.replace(/\/*$/, '');
		           v = v.replace(/^\/*/, '/');

		           path += v;
	           }

	           return path;
	       }

	       function keys(obj) {
	           var a = [];
	           for(var k in obj) {
		           a.push(k);
	           };
	           return a;
	       }

           function starts_with(str, prefix) {
               return str.substring(0, prefix.length) == prefix;
           }

           //// Unit tests

           $s(function() {
	           $s.assert_equal(
                   function() {
	                   return arguments_to_array(arguments);
	               }('one', 'two', 3),
			       [ 'one', 'two', 3 ]
               );

	           $s.assert_equal(join_paths('one/', '/two', 'three'),
			                  'one/two/three');
	           $s.assert_equal(join_paths('/one/', '/two', 'three'),
			                  '/one/two/three');

               $s.assert(starts_with('banana', 'bana'));
               $s.assert_equal(starts_with('abc', 'def'), false);
           });

           //// Public interface

	       this.arguments_to_array = arguments_to_array;
	       this.join_paths = join_paths;
	       this.keys = keys;
           this.starts_with = starts_with;
       });

