// The extension APIs exist only in a browser; pure logic under test never calls them.
;(globalThis as any).chrome ??= {}
