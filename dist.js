
var Distribution = {
    load: function(version, base) {
	base = base || 'http://js.coptix.com/';
	if(base.charAt(base.length-1) != '/')
	    base += '/';
	
	function file(name) {
	    return base + version + "/" + name + ".js";
	}

	window.__dist_version__ = version;
	window.__dist_url__ = base;
	
	document.write('<script type="text/javascript" ' +
		       'src="' + file('modules') + '"></script>');
	document.write('<script type="text/javascript" ' +
		       'src="' + file('dist') + '"></script>');
    }};
