
module('lib.resources',
       imports('lib.lang',
	       'lib.introspection'),
       function(lang, intro) {
	   function get_resource(name) {
	       return lang.join_paths(intro.current_dist_url(),
				      intro.current_dist_version(),
				      intro.caller_module().name,
 				      name);
	   };

	   get_resource.depends_css = function(name) {
	       url = get_resource(name);
	       ext = url.substring(url.lastIndexOf('.')+1);

	       document.write('<link rel="stylesheet" href="' + url +
			      '" type="text/css" />');
	   };

	   return get_resource;
       });
