/**
 * Operations on strings
 * @version 1.0.0
 */

module('lib.types',
       imports('lib.lang'),
       function($c) {
	   this.join_paths = function() {
	       var args = $c.arguments_to_array(arguments);
	       var path = '';
	       
	       for(var i=0; i<args.length; i++) {
		   var v = args[i];
		   path = path.replace(/\/*$/, '');
		   v = v.replace(/^\/*/, '/');
		   
		   path += v;
	       }
	       
	       return path;
	   }

	   this.keys = function(obj) {
	       var a = [];
	       for(var k in obj) {
		   a.push(k);
	       };
	       return a;
	   }
       });
