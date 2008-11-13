
function load_dist(version) {
    function file(name) {
	return "http://js.coptix.com/" + version + "/" + name + ".js";
    }

    window.__dist_version__ = version
   
    document.write('<script type="text/javascript" ' +
		   'src="' + file('modules') + '"></script>');
    document.write('<script type="text/javascript" ' +
		   'src="' + file('dist') + '"></script>');
}
