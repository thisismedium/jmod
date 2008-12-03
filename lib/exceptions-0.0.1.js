
module('lib.exceptions',
       function() {
	   Error_toString = Error.prototype.toString;
	   Error.prototype.toString = function() {
	       var str = Error_toString();
	       if(this.stack)
		   str += "\n STACK: \n" + this.stack;
	       return str;
	   }	   
       }
