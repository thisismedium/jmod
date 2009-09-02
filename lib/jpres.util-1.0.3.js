
module('lib.jpres.util',
       imports('lib.jquery'),
       function($j) {

           function not_implemented(name) {
               return function() {
                   console.error("Presentation function not implemented: ",
                                name);
               };
           }

           function get_numeric_setting(el, name) {
               el = el[0];

               var classes = el.className.split(' ');
               for(var i=0; i<classes.length; i++) {
                   var r = new RegExp(name + "-(.+)");
                   var m = classes[i].match(r);
                   if(m && m[1]) {
                       var num = parseInt(m[1]);
                       if(num) return num;
                   }
               }

               return false;
           }

           // declare a class
           function presentation(selection, opts) {
               this.selection = selection;
               this.opts = jQuery.extend(opts, {
                   on_next: function() {},
                   on_prev: function() {},
                   on_change: function() {}
               });
           }

           var LEFT = 'l';
           var RIGHT = 'r';

           $j.extend(presentation.prototype, {
               init: function() {
                   if(this.select().is('.auto-rotate')) {
                       this.auto_rotate(4000);
                   }
                   else {
                       this.auto_rotate(
                           get_numeric_setting(this.select(), 'auto-rotate')
                       );
                   }

                   this.rotate_speed(
                       get_numeric_setting(this.select(), 'rotate-speed') || 500
                   );

                   this.expand();
                   this.bind_controls();
                   this.select().data('presentation', this);

                   this.start();
               },

               expand: function() {
                   // Normalize the markup by wrapping all of the slides
                   // with a container
                   this.select_slides().wrapAll('<div class="slides"></div>');
               },

               select: function() {
                   return this.selection;
               },

               select_slides: function() {
                   return this.select().find('.slide');
               },

               select_slide_holder: function() {
                   return this.select().find('.slides');
               },

               setting: function(value) {
                   return this.select().is('.' + value);
               },

               auto_rotate: function(speed) {
                   if(speed) this._auto_rotate_speed = speed;
                   return this._auto_rotate_speed;
               },

               rotate_speed: function(speed) {
                   if(speed) this._rotate_speed = speed;
                   return this._rotate_speed;
               },

               slide_width: function() {
                   var slide = this.select_slides();

                   var marginLeft = parseInt(slide.css('margin-left')) || 0;
                   var marginRight = parseInt(slide.css('margin-right')) || 0;

                   return slide.width() + marginLeft + marginRight;
               },

               slide_height: function() {
                   var slide = this.select_slides();

                   var marginTop = parseInt(slide.css('margin-top')) || 0;
                   var marginBottom = parseInt(slide.css('margin-bottom')) || 0;

                   return slide.height() + marginTop + marginBottom;
               },

               bind_controls: function() {
                   var els = this.select();
                   var inst = this;

                   // next
                   els.find('.next').click(function(e) {
                       e.preventDefault();
                       inst.next();
                   });

                   // prev
                   els.find('.prev').click(function(e) {
                       e.preventDefault();
                       inst.prev();
                   });

                   // start/stop
                   var startstop = els.find('.start-stop');
                   startstop.click(function(e) {
                       e.preventDefault();
                       startstop.removeClass('started').removeClass('stopped');

                       if(inst.timer) {
                           startstop.addClass('stopped');
                       }
                       else {
                           startstop.addClass('started');
                       }
                       
                       inst.toggle();
                   });

                   if(this.auto_rotate())
                       startstop.addClass('started');
                   else
                       startstop.addClass('stopped');
               },

               start: function() {
                   if(this.auto_rotate()) {
                       if(this.timer)
                           clearTimeout(this.timer);

                       var _this = this;
                       this.timer = setTimeout(function() {
                           _this.next();
                       }, this.auto_rotate());
                   }
               },

               stop: function() {
                   if(this.timer) {
                       clearTimeout(this.timer);
                       this.timer = null;
                   }
               },

               toggle: function() {
                   if(this.timer)
                       this.stop();
                   else
                       this.start();
               },
               
               move: not_implemented('move'),
               get_current_slide: not_implemented('get_current_slide'),

               next: function() {
                   this.move(RIGHT);
                   this.opts.on_next(this);
                   this.opts.on_change(this);
                   this.start();
                   return this;
               },

               prev: function() {
                   this.move(LEFT);
                   this.opts.on_prev(this);
                   this.opts.on_change(this);
                   this.start();
                   return this;
               },

               current_slide: function(n) {
                   if(n) {
                       this.move(n-1);
                       this.opts.on_change(this);
                       this.start();
                   }
                   else {
                       return this.get_current_slide();
                   }
               }
           });

           this.LEFT = LEFT;
           this.RIGHT = RIGHT;
           this.presentation = presentation;
       });
