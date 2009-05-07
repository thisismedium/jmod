
module('lib.jpres',
       imports('lib.jquery',
               'lib.jpres.util',
               'lib.jpres.fader',
               'lib.jpres.slider'),
       function($j, $pres, $fader, $slider) {
           
           $j.fn.jpres = function() {
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
                       var inst = make_presentation(els);
                       first_inst = first_inst || inst;
                   }
               });
               
               return first_inst;
           }

           $j(function() {
               $j('.presentation').jpres();
           });
           
           function make_presentation(els) {
               var inst;
               
               if(els.is('.crossfade')) {
                   inst = new $fader.presentation(els);
               }
               else {
                   inst = new $slider.presentation(els);
               }

               inst.init();
               return inst;
           }
       });
