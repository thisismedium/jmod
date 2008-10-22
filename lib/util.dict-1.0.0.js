/**
 * Operations on dictionaries
 * @version 1.0.0
 */

module('lib.util.dict',
       function() {
	   function keys(obj) {
	       var a = [];
	       for(var k in obj) {
		   a.push(k);
	       };
	       return a;
	   }
       });
