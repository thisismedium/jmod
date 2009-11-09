//// "resources"
/// Interface into managing centralized media files. We might want to
/// extend this interface to work with local media files for local
/// modules as well.

module('lib.resources',
       imports('lib.class',
	           'lib.util',
	           'lib.introspection'),
       function(cls, util, intro) {

           function ResourceException(msg) {
               this.msg = msg;
               this.toString = function() {
                   return this.msg;
               };
           }

	       // strip_until -- strips a string up to a character
	       function strip_until(str, c) {
	           return str.substring(str.indexOf(c)+1);
	       }

	       // strip_until_last -- strips a string up to the last
	       // occurrence of a character

	       function strip_until_last(str, c) {
	           return str.substring(str.lastIndexOf(c)+1);
	       }

	       // Resource -- represents a resource, providing various
	       // operations
	       var resource = cls.extend({
		       init: function(path) {
		           this.path = path;
		       },

		       string: function() {
		           return this.path;
		       },

		       load: function() {
		           load(this.path);
		       }
           });
           
	       // get -- locates a resource and returns a resource object
	       //
	       // We first look for the caller module and if it is a
	       // centralized module. If so, we get the resource from the
	       // centralized location. Otherwise, if base is passed, we
	       // use it to find the resource; the last attempt is to
	       // simply use the name as the path.
	       function get(name, base) {
	           var module = intro.caller_module();
               var jmod_lib = intro.jmod_lib_url();

	           if(module.name.substring(0, 3) == "lib" && jmod_lib) {
		           var path = util.join_paths(
                       jmod_lib,
                       'media',
				       strip_until(module.name, '.'),
                       module.version,
 					   name
                   );
		           return new resource(path);
	           }
	           else if(base) {
		           return new resource(util.join_paths(base, name));
	           }
	           else {
		           return new resource(name);
	           }
	       };

	       // load -- loads a resource into the browser
	       //
	       // This uses the extension of the file to determine how to
	       // load it in. CSS files will be the most common use of
	       // this.
	       function load(path) {
	           ext = strip_until_last(path, '.');

	           switch(ext) {
	           case 'css':
		           load_css(path);
		           break;
	           default:
		           throw new ResourceException(
                       "No method available for loading" +
					   " this type of resource: " + path
                   );
	           }
	       }

           function load_css(path) {
               if(document.createStyleSheet) {
                   // In IE, use this to force insertion before
                   // any other styles
                   document.createStyleSheet(path, 0);
               }
               else {
                   // In everything else, insert a link tag at the
                   // beginning of the head, before any other styles
	               var head = document.getElementsByTagName("head")[0];
	               var link = document.createElement("link");
	               link.rel = "stylesheet";
	               link.href = path;
	               link.type = "text/css";
	               head.insertBefore(link, head.childNodes[0]);
               }
	       };

	       return get;
       });
