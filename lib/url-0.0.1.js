
module('lib.url',
       function() {
	   function redirect(path) {
	       window.location.href = path;
	   }

	   this.redirect = redirect;
       });
