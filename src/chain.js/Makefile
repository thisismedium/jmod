
CHAIN_VERSION=0.2

all: chain

chain-$(CHAIN_VERSION).js: proj/src/*
	cd proj && \
		java -jar /usr/local/lib/js.jar bin/build.js
	js-make-module proj/build/chain-$(CHAIN_VERSION).js \
		tmpl.js > chain-$(CHAIN_VERSION).js

chain: chain-$(CHAIN_VERSION).js
