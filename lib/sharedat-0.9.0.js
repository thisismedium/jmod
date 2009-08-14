// This is ShareDat(formerly ShareDis) v0.9.0

module('lib.sharedat',
			 imports('lib.jquery'),
			 function($){
				$.fn.share = function(){
					var args = Array.prototype.slice.call(arguments);
		
					// Make options match up to the ShareDis args
					var title = window.title,
							url = window.location,
							position = 'bottom middle',
							serv = null, alts = null;
					for(i=0; i<args.length; i++){
						// If it's a list of services
						if(typeof args[i] == 'string')
							serv = args[i];
						// If it's an array of alt Services
						else if(args[i] instanceof Array){
							alts = args[i];
							alts.unshift(null);
						}
						// If it's a hash of options
						else if(typeof args[i] == 'object'){
							for(n in args[i]){
								if(n == 'position')
									position = args[i][n];
								if(n == 'title')
									title = args[i][n];
								if(n == 'url')
									url == args[i][n];
							}
						}
					}

					// Loop through all elements of the selection
					this.each(function(){
						// Make a new ShareDat
						new ShareDat(this, title, url, position, serv, alts);
					});
					// return the jQuery object unscathed, for further chaining
					return this;
				}

				var goTwitter = function(url,title,e){
					e.preventDefault();
					$.get('http://api.bit.ly/shorten?longUrl=' + url + 	
								'&version=2.0.1&login=medium' +
								'&apiKey=R_5c53b4fd91c4e9811d2cd342528d4692',
								function(d){
									eval('var data = ' + d + ';');
									var result;
									for(var i in data.results)
										result = data.results[i];
							 		window.open('http://twitter.com/home?status=' +
															encodeURIComponent(title) + '%20' +
															encodeURIComponent(result.shortUrl), 'tweet');
								} ,
								'jsonp');
				};
	
				var ShareDat = function(el,title,url,position,servz,alt_urls){
					var element = $(el);
					var pageTitle = title || document.title;
					var pageURL = url || window.location;
					var offset = [0,0];
	
					var timer;
							
					var default_services = servz || "Twitter, Facebook, Digg, Del.icio.us, Reddit, Google, StumbleUpon, MSN Live";
		
					var urls = [];
					if(alt_urls){
				  	if(alt_urls[0]){
				  	  urls = alt_urls;
				  	}else{
				  	  alt_urls.shift();
				  	  urls = urls.concat(alt_urls);
				  	}
				  }
		
					// Make up list of services
					var services = default_services.split(', ');
					for(i=0; i<services.length; i++)
						urls.push([services[i], this.all_urls[services[i]]]);
		
		


					// Create div for Share, cycle through to find unused id, just in case
					var sharePanel = document.createElement('div');
					var panelID = 'share-dis';
					for(var i=2; document.getElementById(panelID); i++){
						panelID = 'share-dis-'+i;
					}
					sharePanel.id = panelID;
					document.body.appendChild(sharePanel);
					sharePanel = $(sharePanel);
					sharePanel.addClass('share-dis');
					sharePanel.css({ 'display':'none',
									'position' : 'absolute',
									'z-index' : '3000' });

					// Create the UL container for links
					var shareUL = $('<ul></ul>').appendTo(sharePanel);

					// Loop through defined URLS, creating links
					for(var i=0; i<urls.length; i++){
						site = urls[i];
						if(!site[0] && !site[1]) return;
						// Make new LI with a class of i.e. 'share-msn-live'
						var li = $('<li></li').appendTo(shareUL).addClass('share-'+site[0].toLowerCase().replace(/[^a-z.]/,'-'));

						var a = $('<a href="#">'+site[0]+'</a>').appendTo(li);
						if(typeof site[1]=='string'){ // if the second param's a string, set the href
							var u = site[1].replace('__URL__',encodeURIComponent(pageURL)).replace('__TITLE__',encodeURIComponent(pageTitle));
							a.attr('href', u);
						}else if(typeof site[1]=='function'){ // if it's a function, have it called on click, and pass it url and title
						  var funk = site[1];
							a.click(function(e){
								var fun = funk;
								fun(pageURL, pageTitle,e);
							})
						}
					}
	
					// Fix up the offset, now that everything's in place
					if(position){						
						if(typeof position == 'string'){
							if(position.match('top')){
								offset[1] = -sharePanel.outerHeight();
							}else if(position.match('bottom')){
								offset[1] = element.outerHeight();
							}else if(position.match('middle')){
								offset[1] = Math.round(element.outerHeight()/2 - sharePanel.outerHeight()/2);
							}
							if(position.match('left')){
								offset[0] = -sharePanel.outerWidth();
							}else if(position.match('right')){
								offset[0] = element.outerWidth();
							}else if(position.match('center')){
								offset[0] = Math.round(element.outerWidth()/2 - sharePanel.outerWidth()/2);
							}
						}else{
							offset = position;
						}
					}
	
					var hide = function(){
						sharePanel.hide();
					}
					var show = function(){
						stopCountdown();
						sharePanel.css({top:element.offset().top+offset[1]+'px', left:element.offset().left+offset[0]+'px'});
						sharePanel.show();
					}
					// On mouseout, wait a second before hiding it, to be spaz-forgiving
					var outCountdown = function(){
						timer = setTimeout(hide, 500);
					}
					var stopCountdown = function(){
						clearTimeout(timer);
					}
	
					element.click(function(e){
						e.preventDefault();
						return false;
					})
	
					element.hover(show, outCountdown);
					sharePanel.hover(show, outCountdown);
				}
	
				ShareDat.prototype.all_urls = {"Twitter": goTwitter,
										"Facebook": "http://www.facebook.com/share.php?u=__URL__&t=__TITLE__",
										"Digg": "http://digg.com/submit?phase=2&url=__URL__&title=__TITLE__",
										"Del.icio.us": "http://del.icio.us/post?url=__URL__&title=__TITLE__",
										"Reddit": "http://reddit.com/submit?url=__URL__&title=__TITLE__",
										"Google": "http://www.google.com/bookmarks/mark?op=edit&bkmk=__URL__&title=__TITLE__",
										"StumbleUpon": "http://www.stumbleupon.com/submit?url=__URL__&title=__TITLE__",
										"MSN Live": "https://favorites.live.com/quickadd.aspx?marklet=1&mkt=en-us&url=__URL__&title=__TITLE__&top=1",
										"LinkedIn": "http://www.linkedin.com/shareArticle?mini=true&url=__URL__&title=__TITLE__&summary=&source=",
										"MySpace": "http://www.myspace.com/Modules/PostTo/Pages/?l=3&u=__URL__&t=__TITLE__&c=",
										"Y! Buzz": "http://buzz.yahoo.com/buzz?targetUrl=__URL__&headline=__TITLE__&src=",
										"Y! Bookmarks": "http://bookmarks.yahoo.com/toolbar/savebm?opener=tb&u=__URL__&t=__TITLE__",
										"Mixx": "http://www.mixx.com/submit?page_url=__URL__",
										"Technorati": "http://www.technorati.com/faves?add=__URL__",
										"Slashdot": "http://slashdot.org/bookmark.pl?url=__URL__&title=__TITLE__"};
							
				ShareDat.prototype.allServices = function(){
					var s = [];
					for(n in this.all_urls)
						s.push(n);
					return s.join(', ');
				}
	
				if(! window.ShareDat) window.ShareDat = ShareDat;
			});