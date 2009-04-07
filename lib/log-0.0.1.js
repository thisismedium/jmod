
// logging
//
// Implements a standardized logging system.
// It will format messages and send them
// send them to the appropriate output port.
//
// There are two types of messages:
//
// MESSAGE
// Performed by calling message(...), the arguments
// will be sent to the output port
//
// ERROR
// Performed by calling error(...), the arguments
// will be sent to the error port
//
// It will attempt to automatically set up
// the current output and error ports, and will fail
// silently if unsuccessful.  The user can
// manually set the ports as well.
//
// If window.__debug__ is false, all messages
// will be suppressed.
//
// (A port is simply a function that takes
// an arbitrary number of parameters)

module('lib.log',
       imports('lib.util'),
       function(util) {
           var output_port = null;
           var error_port = null;
           
           if(window.console) {
               if(window.console.log) {
                   output_port = function() {
                       console.log.apply(this,
                                         util.arguments_to_array(arguments));
                   }
               }

               if(window.console.error) {
                   error_port = function() {
                       console.error.apply(this,
                                           util.arguments_to_array(arguments));
                   }
               }
           }

           function set_output_port(port) {
               output_port = port;
           }

           function set_error_port(port) {
               error_port = port;
           }
           
           function with_output_port(port, k) {
               tmp_port = output_port;
               output_port = port;
               k();
               output_port = tmp_port;
           }

           function with_error_port(port, k) {
               tmp_port = error_port;
               error_port = port;
               k();
               error_port = tmp_port;
           }
           
           function maybe_display_arr(arr, port) {
               if(window.__debug__ && port) 
                   port.apply(window, arr);
           }
           
           function error() {
               maybe_display_arr(
                   [" *** ERROR ***: "].concat(
                       util.arguments_to_array(arguments)),
                   error_port
               );
           }

           function message() {
               maybe_display_arr(util.arguments_to_array(arguments),
                                 output_port);
           }

           this.set_output_port = set_output_port;
           this.set_error_port = set_error_port;
           this.error = error;
           this.message = message;
       });
