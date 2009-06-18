
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
           function presentation(selection) {
               this.selection = selection;
           }

           var LEFT = 0;
           var RIGHT = 1;

           $j.extend(presentation.prototype, {
               init: function() {
                   if(this.select().data('presentation'))
                       return;

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

                   if(this.auto_rotate()) {
                       var _this = this;
                       this.timer = setInterval(function() {
                           _this.next();
                       }, this.auto_rotate());
                   }
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

                   return slide.width() +
                       parseInt(slide.css('margin-left')) +
                       parseInt(slide.css('margin-right'));
               },

               slide_height: function() {
                   var slide = this.select_slides();

                   return slide.height() +
                       parseInt(slide.css('margin-top')) +
                       parseInt(slide.css('margin-bottom'));
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
               },

               move: not_implemented('move'),

               next: function() {
                   this.move(RIGHT);
                   return this;
               },

               prev: function() {
                   this.move(LEFT);
                   return this;
               }
           });

           this.LEFT = LEFT;
           this.RIGHT = RIGHT;
           this.presentation = presentation;
       });
