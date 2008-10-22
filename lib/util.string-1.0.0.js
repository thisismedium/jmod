/**
 * Operations on strings
 * @version 1.0.0
 */

module('lib.util.string',
       imports('lib.util.lang'),
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
       }
