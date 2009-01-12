//
// lib.lang -- extensions to the javascript language
// @version 0.0.1
//

module('lib.lang',
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
	   
	   $s.assertEqual(function() {
	                    return arguments_to_array(arguments);
	                  }('one', 'two', 3),
			  [ 'one', 'two', 3 ]);

	   $s.assertEqual(join_paths('one/', '/two', 'three'),
			  'one/two/three');
	   $s.assertEqual(join_paths('/one/', '/two', 'three'),
			  '/one/two/three');

	   
	   this.arguments_to_array = arguments_to_array;
	   this.join_paths = join_paths;
	   this.keys = keys;
       });

