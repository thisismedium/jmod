//// "jpres"
/// This is a general library for anything slideshow-like. It was
/// inspired by S5 (http://meyerweb.com/eric/tools/s5/). It handles
/// anything with multiple slides, the need to show any number of
/// slides at once, and the need to bind a set of controls for the
/// slides.
///
/// We require your markup to conform to the following S5-inspired
/// standard:
///
/// <div class="presentation">
///    <div class="slide">...</div>
///    ...
///    <a href="#" class="next">...</a>
///    <a href="#" class="prev">...</a>
/// </div>
///
/// A few remarks:
/// * The controls "prev" and "next" can appear anywhere
/// * The "presentation" div can have the following classes:
///    - items-#       : where # is the number of items to display at once
///                      if using a slider like "items-5" (default: 5)
///    - no-repeat     : forces boundaries at the beginning and end
///                      (default: false)
///    - crossfade     : use a crossfade transition with only one item
///                      shown at once
///    - slider        : user a slider transition where multiple items can
///                      be displayed at once (default)
///    - auto-rotate
///    - auto-rotate-# : automatically rotate through the slides, where #
///                      is the speed in ms (default: 4000)
///    - rotate-speed-# : sets the speed of the rotate transistion in ms
///                       (default: 500)
///
/// *** Options ***
///
/// If you initialize it in javascript, the jpres(...) function accepts
/// options, for example:
///
/// jQuery('.presentation.custom').jpres({
///   on_next: function() {}   : A function triggered when next slide is shown
///   on_prev: function() {}   : A function triggered when prev slide is shown
///   on_change: function() {} : A function triggered when slides change
/// });
///
/// *** API ***
///
/// jpres(...) returns a jpres instance, which the following
/// available methods:
///
/// show_slide(n)   : Moves to the nth slide
/// 

module('lib.jpres',
       imports('lib.jquery',
               'lib.jpres.util',
               'lib.jpres.fader',
               'lib.jpres.slider'),
       function($j, $pres, $fader, $slider) {

           $j.fn.jpres = function(opts) {
               var first_inst = null;

               this.each(function() {
                   var els = $j(this);
                   if(!els.is('.presentation')) {
                       console.error('jpres expects a presentation instance, not',
                                     this,
                                     '(did you forget to add the ' +
                                     'class "presentation"?)');
                   }
                   else {
                       var inst = make_presentation(els, opts);
                       first_inst = first_inst || inst;
                   }
               });

               return first_inst;
           };

           $j(function() {
               $j('.presentation').jpres();
           });

           function make_presentation(els, opts) {
               var inst = els.data('presentation');
               if(inst) {
                   inst.opts = $j.extend(inst.opts, opts);
                   return inst;
               }

               if(els.is('.crossfade')) {
                   inst = new $fader.presentation(els, opts);
               }
               else {
                   inst = new $slider.presentation(els, opts);
               }

               inst.init();
               return inst;
           }
       });
