
JQUERY_VERSION=1.3

all: jquery

jquery:
	cd $(JQUERY_VERSION) && make
	js-make-module $(JQUERY_VERSION)/dist/jquery.js tmpl.js \
		> jquery-$(JQUERY_VERSION).js
