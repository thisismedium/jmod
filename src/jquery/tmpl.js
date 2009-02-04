
module('lib.jquery',
       function() {
	       --SOURCE--

           // Sometimes, the document's ready event has already been
           // fired before jquery is loaded. If that is the case, the
           // following code lets jQuery know that the document is
           // ready.
           Modules.ready(function() {
               jQuery.ready();
           });
	       return jQuery.noConflict();
       });
