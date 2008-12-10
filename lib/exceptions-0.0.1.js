//
// lib.exceptions -- provides utilities for exceptions
// @version 0.0.1
//
module('lib.exceptions',
       function() {
	   // Exception -- standard exception wich always prints
	   // a stack trace along with its object
	   function Exception(obj) {
	       this.obj = obj;
	       this.error = new Error();
	   }

	   Exception.prototype.toString = function() {
	       var str = this.obj.toString();
	       if(this.error.stack)
		   str += "\n STACK: \n" + this.error.stack;
	       return str;
	   }

	   this.Exception = Exception;
       });
