
module('lib.jpres.fader',
       imports('lib.jquery',
               'lib.jpres.util'),
       function($j, $pres) {

           function fader(els, opts) {
               $pres.presentation.call(this, els, opts);
           }

           fader.prototype = new $pres.presentation();

           $j.extend(fader.prototype, {
               init: function() {
                   var ret = $pres.presentation.prototype.init.call(this);
                   if(ret) return ret;

                   var holder = this.select_slide_holder();
                   var slides = this.select_slides();

                   holder.css('position', 'relative');
                   slides.css({'position': 'absolute',
                               'top': 0,
                               'left': 0})
                       .hide();

                   slides.filter(':first').show();

                   holder.height(this.slide_height())
                       .width(this.slide_width());
               },

               // Movement
               move: function(where) {
                   var slides = this.select_slides();
                   var width = this.slide_width();

                   slides.filter(':visible').stop(true, true);

                   var current = slides.filter(':visible');
                   var next;

                   if(typeof where == "number") {
                       var slide = current.parent().children()[where];
                       next = $j(slide);

                       if(!slide || next[0] == current[0]) return;
                   }
                   else if(where == $pres.RIGHT) {
                       next = current.next(':first');
                       if(!next.length && this.setting('no-repeat')) {
                           return;
                       }
                       else if(!next.length) {
                           next = slides.filter(':first');
                       }
                   }
                   else {
                       next = current.prev(':first');
                       if(!next.length && this.setting('no-repeat')) {
                           return;
                       }
                       else if(!next.length) {
                           next = slides.filter(':last');
                       }
                   }

                   current.fadeOut(this.rotate_speed());
                   next.fadeIn(this.rotate_speed());
               }
           });

           this.presentation = fader;
       });
