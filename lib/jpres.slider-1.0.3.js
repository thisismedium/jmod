
module('lib.jpres.slider',
       imports('lib.jquery',
               'lib.jpres.util',
               'lib.jquery.easing'),
       function($j, $pres) {

           function slider(els, opts) {
               $pres.presentation.call(this, els, opts);
           }

           slider.prototype = new $pres.presentation();

           $j.extend(slider.prototype, {
               init: function() {
                   var ret = $pres.presentation.prototype.init.call(this);
                   if(ret) return ret;

                   var slide_holder = this.select_slide_holder();

                   // Mangle the markup
                   slide_holder.css('position', 'relative')
                       .children()
                       .wrapAll('<div class="slider clearfix"></div>');

                   var slider = slide_holder.children('.slider');
                   slider.css({'position': 'absolute',
                               'top': 0,
                               'left': 0});

                   // Set up the view
                   var slides = this.select_slides();
                   var width = this.slide_width();
                   var height = this.slide_height();

                   slider.width(slides.length*width);
                   slide_holder.width(this.num_view_items()*width)
                       .height(height)
                       .css('overflow', 'hidden');

                   if(this.has_field())
                       this.install_selector();
               },

               expand: function() {
                   var els = this.select();
                   var select = this.find('select');

                   if(select.length) {
                       var holder = $j('<div class="slides"></div>');

                       select.find('option').each(function() {
                           var el = $j(this);
                           var selected = this.selected ? 'selected' : '';
                           holder.append('<div class="slide ' + selected + '">' +
                                         el.text() +
                                         '<div class="value">' +
                                         el.val() +
                                         '</div></div>');
                       });

                       select.after(holder);
                       select.hide();
                   }
                   else {
                       $pres.presentation.prototype.expand.call(this);
                   }
               },

               init_slide: function(slide) {
                   var _this = this;

                   if(this.has_field()) {
                       slide.click(function(e) {
                           _this.pick_slide(e.target);
                       });
                   }

                   return slide;
               },

               install_selector: function() {
                   var holder = this.select_slide_holder();
                   var slides = this.select_slides();
                   var _this = this;

                   slides.click(function(e) {
                       _this.pick_slide(e.target);
                   });

                   if(!slides.filter('.selected').length)
                       this.pick_slide(0);
               },

               pick_slide: function(obj) {
                   var slides = this.select_slides();
                   slides.removeClass('selected');

                   if(typeof(obj) == 'number') {
                       slide = $j(slides[obj]);
                   }
                   else {
                       slide = $j(obj);
                   }

                   slide.addClass('selected');
                   this.select_field().val(this.get_slide_val(slide));
               },

               get_slide_val: function(slide) {
                   var v = slide.find('.value');
                   if(v.length)
                       return v.text();
                   else
                       return slide.text();
               },

               slide: function() {
                   return this.select_slides().filter('.selected');
               },

               val: function() {
                   return this.select_field().val();
               },

               //
               // Determines the number of items which should be displayed
               // for a presentation. This defaults to 5 and can be
               // overriden by adding a class to the presentation in the
               // format 'item-#', where # is the number of items.
               //
               num_view_items: function() {
                   var pres = this.select();
                   var slides = this.select_slides();

                   var num = 5;
                   for(var i=0; i<20; i++) {
                       if(pres.is('.items-' + i)) {
                           num = i;
                           break;
                       }
                   }

                   if(num > slides.length) return slides.length;
                   return num;
               },

               //
               // Returns the position of the slider in pixels
               // relative to the view
               //
               current_pos: function() {
                   return parseInt(this.select_slider().css('left'));
               },

               // Selectors
               select_slider: function() {
                   return this.find('.slider');
               },

               select_field: function() {
                   return this.find('select');
               },

               has_field: function() {
                   return !!this.select_field().length;
               },

               // Movement
               move: function(where) {
                   if(typeof where == "integer") {
                       console.error('slider does not support slide indexing yet!');
                       return;
                   }

                   var dir = where;

                   var holder = this.select_slide_holder();
                   var slider = this.select_slider();
                   slider.stop(true, true);

                   var width = this.slide_width();
                   var view_length = holder.width();
                   var slider_length = slider.width();

                   var _this = this;

                   function has_ended() {
                       var pos = _this.current_pos();
                       var pos_right = pos + slider.width();

                       if(dir == $pres.RIGHT)
                           return (fuzzy_equal(pos_right, view_length) ||
                                   pos_right < view_length);
                       else
                           return (fuzzy_equal(pos, 0) || pos > 0);
                   }

                   function reset_end() {
                       if(dir == $pres.RIGHT)
                           slider.css('left', view_length-slider.width());
                       else
                           slider.css('left', 0);
                   }

                   function shift(num) {
                       if(dir == $pres.RIGHT)
                           return -num;
                       else
                           return num;
                   }

                   function shuffle() {
                       if(dir == $pres.RIGHT) {
                           var slide = _this.select_slides().filter(':first');
                           slide.remove();
                           slider.css('left',
                                      _this.current_pos() + _this.slide_width());
                           slider.append(_this.init_slide(slide));
                       }
                       else {
                           var slide = _this.select_slides().filter(':last');
                           slide.remove();
                           slider.css('left',
                                      _this.current_pos() - _this.slide_width());
                           slider.prepend(_this.init_slide(slide));
                       }
                   }

                   if(has_ended() && this.setting('no-repeat')) {
                       reset_end();

                       pos = this.current_pos();
                       slider.animate({'left': pos + shift(width/2.0)},
                                      this.rotate_speed())
                             .animate({'left': pos},
                                      this.rotate_speed(),
                                      'easeOutBounce');
                   }
                   else {
                       if(has_ended())
                           shuffle();

                       pos = this.current_pos();
                       slider.animate({'left': pos + shift(width) },
                                      this.rotate_speed());
                   }
               }
           });

           // Util
           function fuzzy_equal(num1, num2) {
               return Math.abs(num1-num2) < 3;
           }

           this.presentation = slider;
       });

