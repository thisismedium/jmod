
/**
 * Extend jQuery with functions for PUT and DELETE requests.
 * @version 1.0.0
 */
module('lib.jquery.put_delete',
       imports('lib.jquery'),
       function(jQuery) {
	   function _ajax_request(url, data, callback, type, method) {
	       if (jQuery.isFunction(data)) {
		   callback = data;
		   data = {};
	       }
	       return jQuery.ajax({
		   type: method,
		   url: url,
		   data: data,
		   success: callback,
		   dataType: type
               });
	   }

	   jQuery.extend({
	       put: function(url, data, callback, type) {
		   return _ajax_request(url, data, callback, type, 'PUT');
	       },
	       delete_: function(url, data, callback, type) {
		   return _ajax_request(url, data, callback, type, 'DELETE');
	       }
	   });
       });
