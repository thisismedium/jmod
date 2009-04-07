//
// lib.resources -- interface into managing
// centralized media files.  We might want to
// extend this interface to work with local media
// files for local modules as well.
// @version 0.0.1
//

module('lib.resources',
       imports('lib.class',
	       'lib.util',
	       'lib.introspection',
	       'lib.exceptions'),
       function(cls, lang, intro, ex) {

	   // strip_until -- strips a string up to a character
	   function strip_until(str, c) {
	       return str.substring(str.indexOf(c)+1);
	   }

	   // strip_until_last -- strips a string up to the
	   // last occurrence of a character
	   function strip_until_last(str, c) {
	       return str.substring(str.lastIndexOf(c)+1);
	   }

	   // Resource -- represents a resource,
	   // providing various operations
	   var resource = cls.extend(
	       {
		   init: function(path) {
		       this.path = path;
		   },

		   toString: function() {
		       return this.path;
		   },

		   load: function() {
		       load(this.path);
		   }
	       }
	   );

	   // get -- locates a resource and returns a resource object
	   //
	   // We first look for the caller module and if it is a
	   // centralized module.  If so, we get the resource from the
	   // centralized location.  Otherwise, if base is passed,
	   // we use it to find the resource; the last attempt is to
	   // simply use the name as the path.
	   function get(name, base) {
	       var module = intro.caller_module();

	       if(module.name.substring(0, 3) == "lib") {
		   var path = lang.join_paths(intro.current_dist_url(),
					      intro.current_dist_version(),
					      strip_until(module.name, '.'),
 					      name);
		   return new resource(path);
	       }
	       else if(base) {
		   return new resource(lang.join_paths(base, name));
	       }
	       else {
		   return new resource(name)
	       }
	   };

	   // load -- loads a resource into the browser
	   //
	   // This uses the extension of the file to determine
	   // how to load it in.  CSS files will be the most
	   // common use of this.
	   function load(path) {
	       ext = strip_until_last(path, '.');

	       switch(ext) {
	       case 'css':
		   load_css(path);
		   break;
	       default:
		   throw new ex.Exception("No method available for loading" +
					  " this type of resource: " + path);
	       }
	   }

	   // load_css -- loads in a css file that
	   // a javascript module depends on.
	   //
	   // It throws it as high as possible in the DOM
	   // (first child of the head element) to make sure
	   // users can still override the styles
	   function load_css(path) {
	       var head = document.getElementsByTagName("head")[0];
	       var link = document.createElement("link");
	       link.rel = "stylesheet";
	       link.href = path;
	       link.type = "text/css";
	       head.insertBefore(link, head.childNodes[0]);
	   };

	   return get;
       });
