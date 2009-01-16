
DIST_VERSION=1.0.0

all: chain.js dist

chain.js:
	cd src/chain.js && \
		java -jar /usr/local/lib/js.jar bin/build.js

	{ \
		echo "module('lib.jquery.chain', "; \
		echo "       imports('lib.jquery'),"; \
		echo "       function(jQuery) {"; \
		cat src/chain.js/build/chain-0.2.js; \
		echo "});"; \
	} > lib/jquery.chain-0.2.0.js

dist:
	rm -r dist/$(DIST_VERSION) \
	js-new-dist $(DIST_VERSION)
