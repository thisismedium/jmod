
JQUERY_VERSION=1.3.1

all: jquery

jquery:
	cd $(JQUERY_VERSION) && make jquery
	js-make-module $(JQUERY_VERSION)/dist/jquery.js tmpl.js \
		> jquery-$(JQUERY_VERSION).js
