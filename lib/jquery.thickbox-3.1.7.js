/*
 * Thickbox - One Box To Rule Them All.
 * @version 3.1
 * By Cody Lindley (http://www.codylindley.com)
 * Copyright (c) 2007 cody lindley
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*/

module('lib.jquery.thickbox', imports('lib.jquery', 'lib.resources'),
	function($, $r) {
       
	if (!window['tb']) {
		window['tb'] = {};
		var tb = window['tb'];
	}

	$r('thickbox.css').load();
    
	tb.opts = {
		showTitle: false,
		closeText: "",
		loadingImage: $r("loadingAnimation.gif").string()
	};

/*!!!!!!!!!!!!!!!!! edit below this line at your own risk !!!!!!!!!!!!!!!!!!!!!!!*/

	tb.imgLoader = null;

	tb.reload_image = function() {
		tb.imgLoader = new Image();// preload image
		tb.imgLoader.src = tb.opts.loadingImage;
	}

	

	//add thickbox to href & area elements that have a class of .thickbox
	tb.tb_init = function(domChunk){
		$(domChunk).click(function(){
			var t = this.title || this.name || null;
			var a = this.href || this.alt;
			var g = this.rel || false;
			tb.tb_show(t,a,g);
			this.blur();
			return false;
		});
	}

	tb.__on_close;
	tb.__on_open = [];

	    tb.on_open = function() {
	        for (var i in tb.__on_open) {
	            tb.__on_open[i]();
	        }
	    };

        
	tb.tb_show = function(caption, url, imageGroup) {//function called when the user clicks on a thickbox link
		//try {
			if (typeof document.body.style.maxHeight === "undefined") {//if IE 6
				$("body","html").css({height: "100%", width: "100%"});
				$("html").css("overflow","hidden");
				if (document.getElementById("TB_HideSelect") === null) {//iframe to hide select elements in ie6
					$("body").append("<iframe id='TB_HideSelect'></iframe><div id='TB_overlay'></div><div id='TB_window'></div>");
					$("#TB_overlay").click(tb.tb_remove);
				}
			} else {//all others
				if (document.getElementById("TB_overlay") === null) {
					$("body").append("<div id='TB_overlay'></div><div id='TB_window'></div>");
					$("#TB_overlay").click(tb.tb_remove);
				}
			}

			if (tb.tb_detectMacXFF()) {
				$("#TB_overlay").addClass("TB_overlayMacFFBGHack");//use png overlay so hide flash
			} else {
				$("#TB_overlay").addClass("TB_overlayBG");//use background and opacity
			}

			if (caption===null){ caption=""; }

			$("body").append("<div id='TB_load'><img src='" + tb.imgLoader.src + "' /></div>");//add loader to the page
			$('#TB_load').show();//show loader


			var baseURL;
			if (url.indexOf("?")!==-1) { //ff there is a query string involved
				baseURL = url.substr(0, url.indexOf("?"));
			} else {
				baseURL = url;
			}

			var urlString = /\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/;
			var urlType = baseURL.toLowerCase().match(urlString);
	   
			if (urlType == '.jpg' || urlType == '.jpeg' || urlType == '.png' || urlType == '.gif' || urlType == '.bmp') {//code to show images

				tb.TB_PrevCaption = "";
				tb.TB_PrevURL = "";
				tb.TB_PrevHTML = "";
				tb.TB_NextCaption = "";
				tb.TB_NextURL = "";
				tb.TB_NextHTML = "";
				tb.TB_imageCount = "";
				tb.TB_FoundURL = false;
				if (imageGroup) {
					TB_TempArray = $("a[rel="+imageGroup+"]").get();
					for (TB_Counter = 0; ((TB_Counter < TB_TempArray.length) && (tb.TB_NextHTML === "")); TB_Counter++) {
						var urlTypeTemp = TB_TempArray[TB_Counter].href.toLowerCase().match(urlString);
						if (!(TB_TempArray[TB_Counter].href == url)) {
							if (tb.TB_FoundURL) {
								tb.TB_NextCaption = TB_TempArray[TB_Counter].title;
								tb.TB_NextURL = TB_TempArray[TB_Counter].href;
								tb.TB_NextHTML = "<span id='TB_next'>&nbsp;&nbsp;<a href='#'>Next &gt;</a></span>";
							} else {
								tb.TB_PrevCaption = TB_TempArray[TB_Counter].title;
								tb.TB_PrevURL = TB_TempArray[TB_Counter].href;
								tb.TB_PrevHTML = "<span id='TB_prev'>&nbsp;&nbsp;<a href='#'>&lt; Prev</a></span>";
							}
						} else {
							tb.TB_FoundURL = true;
							tb.TB_imageCount = "Image " + (TB_Counter + 1) +" of "+ (TB_TempArray.length);
						}
					}
				}

				imgPreloader = new Image();
				imgPreloader.onload = function(){
					imgPreloader.onload = null;

					// Resizing large images - orginal by Christian Montoya edited by me.
					var pagesize = tb.tb_getPageSize();
					var x = pagesize[0] - 150;
					var y = pagesize[1] - 150;
					var imageWidth = imgPreloader.width;
					var imageHeight = imgPreloader.height;
					if (imageWidth > x) {
						imageHeight = imageHeight * (x / imageWidth);
						imageWidth = x;
						if (imageHeight > y) {
							imageWidth = imageWidth * (y / imageHeight);
							imageHeight = y;
						}
					} else if (imageHeight > y) {
						imageWidth = imageWidth * (y / imageHeight);
						imageHeight = y;
						if (imageWidth > x) {
							imageHeight = imageHeight * (x / imageWidth);
							imageWidth = x;
						}
					}
					// End Resizing
	
					tb.TB_WIDTH = imageWidth + 30;
					tb.TB_HEIGHT = imageHeight + 60;

	            	//if (tb.opts.showText)
	                	$("#TB_window").append("<a href='' id='TB_ImageOff' title='Close'><img id='TB_Image' src='"+url+"' width='"+imageWidth+"' height='"+imageHeight+"' alt='"+caption+"'/></a>" + "<div id='TB_caption'>"+caption+"<div id='TB_secondLine'>" + tb.TB_imageCount + tb.TB_PrevHTML + tb.TB_NextHTML + "</div></div><div id='TB_closeWindow'><a href='#' id='TB_closeWindowButton' title='Close'>"+tb.opts.closeText+"</a></div>");
	
					$("#TB_closeWindowButton").click(tb.tb_remove);
	
					if (!(tb.TB_PrevHTML === "")) {
						tb.goPrev = function(){
							if ($(document).unbind("click",tb.goPrev)){ $(document).unbind("click",tb.goPrev); }
							$("#TB_window").remove();
							$("body").append("<div id='TB_window'></div>");
							tb.tb_show(tb.TB_PrevCaption, tb.TB_PrevURL, imageGroup);
							return false;
						};
						$("#TB_prev").click(tb.goPrev);
					}
	
					if (!(tb.TB_NextHTML === "")) {
						tb.goNext = function(){
							$("#TB_window").remove();
							$("body").append("<div id='TB_window'></div>");
							tb.tb_show(tb.TB_NextCaption, tb.TB_NextURL, imageGroup);
							return false;
						};
						$("#TB_next").click(tb.goNext);
	
					}
				
					$(document).keydown(function(e) {
				    	if (e.keyCode == 27) { // close
							tb.tb_remove();
							return false;
						} else if (e.keyCode == 190) { // display previous image
							if (!(tb.TB_NextHTML == "")) {
								goNext();
								return false;
							}
						} else if (e.keyCode == 188) { // display next image
							if (!(tb.TB_PrevHTML == "")) {
								goPrev();
								return false;
							}
						}
						return false;
					});
	
					/*document.onkeydown = function(e){
						if (e == null) { // ie
							keycode = event.keyCode;
						} else { // mozilla
							keycode = e.which;
						}
						if(keycode == 27){ // close
							tb_remove();
						} else if(keycode == 190){ // display previous image
							if(!(TB_NextHTML == "")){
								document.onkeydown = "";
								goNext();
							}
						} else if(keycode == 188){ // display next image
							if(!(TB_PrevHTML == "")){
								document.onkeydown = "";
								goPrev();
							}
						}
					};*/	
	
					tb.tb_position();
					$("#TB_load").remove();
					$("#TB_ImageOff").click(tb.tb_remove);
					$("#TB_window").css({display:"block"}); //for safari using css instead of show
                    tb.on_show();
				};

				imgPreloader.src = url;
			} else {//code to show html
				var queryString = url.replace(/^[^\?]+\??/,'');
				
				var params = tb.tb_parseQuery( queryString );
	
				tb.TB_WIDTH = (params['width']*1) || 630; //defaults to 630 if no paramaters were added to URL
				tb.TB_HEIGHT = (params['height']*1) + 40;
				ajaxContentW = tb.TB_WIDTH;
				ajaxContentH = tb.TB_HEIGHT - 45;
	
				if (url.indexOf('TB_iframe') != -1) {// either iframe or ajax window
					urlNoQuery = url.split('TB_');
					$("#TB_iframeContent").remove();
					if (params['modal'] != "true") {//iframe no modal
						heightStr = params["height"] ? "height:"+(ajaxContentH + 17)+"px;" : '';
	                    if (tb.opts.showTitle)
						    $("#TB_window").append("<div id='TB_title'><div id='TB_ajaxWindowTitle'>"+caption+"</div><div id='TB_closeAjaxWindow'><a href='#' id='TB_closeWindowButton' title='Close'>"+tb.opts.closeText+"</a></div></div>");
	                    $("#TB_window").append("<iframe frameborder='0' hspace='0' src='"+urlNoQuery[0]+"' id='TB_iframeContent' name='TB_iframeContent"+Math.round(Math.random()*1000)+"' onload='tb.tb_showIframe()' style='width:"+(ajaxContentW + 29)+"px;" + heightStr +"' > </iframe>");
					} else {//iframe modal
						$("#TB_overlay").unbind();
						$("#TB_window").append("<iframe frameborder='0' hspace='0' src='"+urlNoQuery[0]+"' id='TB_iframeContent' name='TB_iframeContent"+Math.round(Math.random()*1000)+"' onload='tb.tb_showIframe()' style='width:"+(ajaxContentW + 29)+"px;height:"+(ajaxContentH + 17)+"px;'> </iframe>");
					}
				} else {// not an iframe, ajax
					if ($("#TB_window").css("display") != "block"){
						if (params['modal'] != "true") {//ajax no modal
	                        if (tb.opts.showTitle)
						        $("#TB_window").append("<div id='TB_title'><div id='TB_ajaxWindowTitle'>"+caption+"</div><div id='TB_closeAjaxWindow'><a href='#' id='TB_closeWindowButton'>"+tb.opts.closeText+"</a></div></div>");
	                        $("#TB_window").append("<div id='TB_ajaxContent' style='width:"+ajaxContentW+"px;height:"+ajaxContentH+"px'></div>");
						} else {//ajax modal
							$("#TB_overlay").unbind();
							$("#TB_window").append("<div id='TB_ajaxContent' class='TB_modal' style='width:"+ajaxContentW+"px;height:"+ajaxContentH+"px;'></div>");
						}
					} else {//this means the window is already up, we are just loading new content via ajax
						$("#TB_ajaxContent")[0].style.width = ajaxContentW +"px";
						$("#TB_ajaxContent")[0].style.height = ajaxContentH +"px";
						$("#TB_ajaxContent")[0].scrollTop = 0;
						$("#TB_ajaxWindowTitle").html(caption);
					}
				}
		
				$("#TB_closeWindowButton").click(tb.tb_remove);
				if (url.indexOf('TB_inline') != -1) {
					$("#TB_ajaxContent").append($('#' + params['inlineId']).html());
					$("#TB_window").unload(function () {
						$('#' + params['inlineId']).append( $("#TB_ajaxContent").children() ); // move elements back when you're finished
					});
					tb.tb_position();
					$("#TB_load").remove();
					$("#TB_window").css({display:"block"});
	
					tb.on_open();
				} else if (url.indexOf('TB_iframe') != -1) {
					tb.tb_position();
					if ($.browser.safari) {//safari needs help because it will not fire iframe onload
						$("#TB_load").remove();
						$("#TB_window").css({display:"block"});
					}
	
					tb.on_open();
				} else {
					url += "&random=" + (new Date().getTime());
					$.get(url, function(r) {
						r = r.replace(/\<script.*\/script\>/g, '');
						$("#TB_ajaxContent").html(r);
						tb.tb_position();
						$("#TB_load").remove();
						tb.tb_init("#TB_ajaxContent a.thickbox");
						$("#TB_window").css({display:"block"});
						$("#TB_window .close").click(tb.tb_remove);
		
						tb.on_open();
					});
				}
			
			
				if(!params['modal']){
				    /*document.onkeyup = function(e){
						if (e == null) { // ie
							keycode = event.keyCode;
						} else { // mozilla
							keycode = e.which;
						}
						if(keycode == 27){ // close
							tb_remove();
						}
					};*/
					$(document).keyup(function(event) {
					    if (event.keyCode == 27) {
					        tb.tb_remove();
					    }
					});
				}
			}

		//} catch(e) {
		//	//nothing here
		//}
	
	
	}

	tb.dict_to_qs = function(d) {
		var qs = '';
		$.each(d, function(k, v) {
			if (qs != '') qs += '&';
			qs += (k + '=' + v);
		});
		return qs;
	}
	
	tb.tb_config = function(_opts) {
		$.extend(tb.opts, _opts);
		if (tb.opts.loadingImage)
			tb.reload_image();
	}
	
	tb.tb_on_open = function(func) {
		tb.__on_open.push(func);
	}
	
	tb.tb_show_with_callback = function(caption, url, opts, k) {
		tb.__on_close = k;
		opts = tb.dict_to_qs(opts);
		tb.tb_show(caption, url + '?' + opts);
	}
	
	tb.tb_show_with_content = function(caption, els, opts, k) {
		if ($('#lightbox-buffer').length == 0) {
			$('body').append('<div id="lightbox-buffer" style="display: none;"></div>');
		}
	
		$('#lightbox-buffer').html(els);
	
		opts = opts || {};
		opts['inlineId'] = 'lightbox-buffer';
		tb.tb_show_with_callback(caption, '#TB_inline', opts, k);
	}

	//helper functions below
	tb.tb_showIframe = function(){
		$("#TB_load").remove();
		$("#TB_window").css({display:"block"});
	}

	tb.tb_remove = function() {
	    $("#TB_imageOff").unbind("click");
	    $("#TB_closeWindowButton").unbind("click");
	    $("#TB_window").fadeOut("fast",function(){$('#TB_window,#TB_overlay,#TB_HideSelect').trigger("unload").unbind().remove();});
	    $("#TB_load").remove();
	    if (typeof document.body.style.maxHeight == "undefined") {//if IE 6
			$("body","html").css({height: "auto", width: "auto"});
			$("html").css("overflow","");
	    }
	    $(document).unbind('keydown');
	    $(document).unbind('keyup');
		//document.onkeydown = "";
		//document.onkeyup = "";
	
		if (tb.__on_close) {
			tb.__on_close();
			tb.__on_close = null;
		}
	
		return false;
	}

	tb.tb_position = function() {
		$("#TB_window").css({marginLeft: '-' + parseInt((tb.TB_WIDTH / 2),10) + 'px', width: tb.TB_WIDTH + 'px'});
		if ( !(jQuery.browser.msie && jQuery.browser.version < 7)) { // take away IE6
			$("#TB_window").css({marginTop: '-' + parseInt((tb.TB_HEIGHT / 2),10) + 'px'});
		}
	}

	tb.tb_parseQuery = function( query ) {
		var Params = {};
		if ( ! query ) {return Params;}// return empty object
		var Pairs = query.split(/[;&]/);
		for ( var i = 0; i < Pairs.length; i++ ) {
			var KeyVal = Pairs[i].split('=');
			if ( ! KeyVal || KeyVal.length != 2 ) { continue; }
			var key = unescape( KeyVal[0] );
			var val = unescape( KeyVal[1] );
			val = val.replace(/\+/g, ' ');
			Params[key] = val;
		}
		return Params;
	}

	tb.tb_getPageSize = function(){
		var de = document.documentElement;
		var w = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
		var h = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
		arrayPageSize = [w,h];
		return arrayPageSize;
	}

	tb.tb_detectMacXFF = function() {
		var userAgent = navigator.userAgent.toLowerCase();
		if (userAgent.indexOf('mac') != -1 && userAgent.indexOf('firefox')!=-1) {
			return true;
		}
		return false;
	}

	// hack to get iframes working
	window.tb_showIframe = tb.tb_showIframe;
	this.on_open = tb.tb_on_open;
	this.open = tb.tb_show_with_callback;
	this.open_image_group =  tb.tb_show;
	this.open_with_content = tb.tb_show_with_content;
	this.close = tb.tb_remove;
	this.config = tb.tb_config;
	
	//on page load call tb_init
	$(document).ready(function(){
		tb.tb_init('a.thickbox, area.thickbox, input.thickbox');//pass where to apply thickbox
		tb.reload_image();
	});
});
