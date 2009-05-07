
module('lib.jpres.util',
       imports('lib.jquery'),
       function($j) {
           
           function not_implemented(name) {
               return function() {
                   console.error("Presentation function not implemented: ",
                                name);
               }
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
                   this.expand();
                   this.bind_controls();
                   this.select().data('presentation', this);
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
