//
// lib.resources -- interface into managing
// centralized media files.  We might want to
// extend this interface to work with local media
// files for local modules as well.
// @version 0.0.1
//

module('lib.resources',
       imports('lib.lang',
	       'lib.introspection',
	       'lib.exceptions'),
       function(lang, intro, ex) {

	   // strip_until -- strips a string up to a character
	   function strip_until(str, c) {
	       return str.substring(str.indexOf(c)+1);
	   }

	   // strip_until_last -- strips a string up to the
	   // last occurrence of a character
	   function strip_until_last(str, c) {
	       return str.substring(0, str.lastIndexOf(c));
	   }
	   

	   // get_resource -- gets a path to a centralized resource
	   //
	   // Modules are given space in the centralized javascript
	   // repository for media files.  This is the interface
	   // for retrieving those files.
	   function get_resource(name, module) {
	       module = module || intro.caller_module();

	       if(module.name.substring(0, 3) != "lib")
		   throw new ex.Exception("Resources are only supported " +
					  "for centralized modules");

	       return lang.join_paths(intro.current_dist_url(),
				      intro.current_dist_version(),
				      strip_until(module.name, '.'),
 				      name);
	   };

	   // depends_css -- loads in a css file that
	   // a javascript module depends on.
	   //
	   // It throws it as high as possible in the DOM
	   // (first child of the head element) to make sure
	   // users can still override the styles
	   function load_css(name) {
	       url = get_resource(name, intro.caller_module());

	       var head = document.getElementsByTagName("head")[0];
	       var link = document.createElement("link");
	       link.rel = "stylesheet";
	       link.href = url;
	       link.type = "text/css";
	       head.insertBefore(link, head.childNodes[0]);
	   };

	   module = get_resource;
	   module.load_css = load_css;
	   return module;
       });
