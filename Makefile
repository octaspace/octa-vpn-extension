# The Chrome Web Store package. `npm run build` keeps the manifest's `key`:
# it pins the unpacked extension's ID, which the dashboard's OAuth redirect
# expects. The store refuses a manifest with `key` and assigns the ID itself,
# so the release is a copy of the build without it.

VERSION := $(shell node -p "require('./package.json').version")
CHROME_BUILD := build/chrome-mv3-prod
CHROME_RELEASE := build/chrome-release
CHROME_ZIP := build/octa-vpn-chrome-$(VERSION).zip

.PHONY: chrome-release
chrome-release:
	npm run build
	rm -rf $(CHROME_RELEASE) $(CHROME_ZIP)
	cp -r $(CHROME_BUILD) $(CHROME_RELEASE)
	node -e 'const fs = require("fs"), f = process.argv[1], m = JSON.parse(fs.readFileSync(f, "utf8")); delete m.key; fs.writeFileSync(f, JSON.stringify(m))' $(CHROME_RELEASE)/manifest.json
	cd $(CHROME_RELEASE) && zip -qrX $(abspath $(CHROME_ZIP)) .
	@if unzip -p $(CHROME_ZIP) manifest.json | grep -q '"key"'; then \
		echo "error: $(CHROME_ZIP) still has key in manifest.json" >&2; exit 1; fi
	@echo "Chrome Web Store package: $(CHROME_ZIP)"
