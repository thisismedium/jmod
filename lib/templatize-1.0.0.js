
module('lib.templatize',
	   imports('lib.jquery'),
	   function($j) {

		   function set_value(els, value) {
			   els.each(function() {
				   var el = $j(this);
				   if(el.is('select') && $j.isArray(value)) {
					   el.empty();
					   $j.each(value, function(i, n) {
                           var val = n;
                           var name = n;
                           if($j.isArray(n)) {
                               val = n[0];
                               name = n[1];
                           }
						   $j('<option></option>')
							   .attr('value', val)
							   .html(name)
							   .appendTo(el);
					   });
				   }
				   else if(el.is(':input')) {
					   el.val(value);
				   }
				   else if(el.is('img')) {
					   el.attr('src', value);
				   }
				   else {
					   el.html(value);
				   }
			   });
		   }

		   function apply_item(template, selectors, item) {
			   $j.each(item, function(k, v) {
				   set_value(template.filter('.' + k), v);
				   set_value(template.find('.' + k), v);
			   });

               $j.each(selectors, function(k, v) {
                   v(item, k=='.' ? template : template.find(k));
               });

			   return template;
		   }

		   function apply_items(template, selectors, items) {
			   var tmpl = $j(template);
			   return $j.map(items, function(v) {
				   return apply_item(tmpl.clone(), selectors, v)
                             .data('item', v);
			   });
		   }

		   function data_property(name) {
			   return function(thing) {
				   if(thing) {
					   this.data(name, thing);
					   return this;
				   }
				   else {
					   return this.data(name);
				   }
			   }
		   }

		   $j.fn.item = data_property('item');
		   $j.fn.items = data_property('items');
           $j.fn.template = data_property('template');

		   $j.fn.templatize = function(selectors) {
			   if(!this.data('template')) {
				   this.data('template', this.html());
			   }

			   if(this.data('items')) {
				   this.empty();
				   var tmpl = this.template();
				   var element = this;
				   $j.each(apply_items(tmpl,
                                       selectors || {},
                                       this.data('items')),
						   function(i, v) {
							   element.append(v);
						   });
			   }
			   else if(this.data('item')) {
				   apply_item(this, selectors || {}, this.data('item'));
			   }

			   return this;
		   }
	   });
