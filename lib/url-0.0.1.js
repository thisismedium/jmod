
module('lib.url',
       function() {
	       function redirect(path) {
	           window.location.href = path;
	       }

           function refresh() {
               window.location.href = window.location.href;
           }

	       this.redirect = redirect;
           this.refresh = refresh;
       });
