// Invoked as `tsx prerender` from package.json `generate`; same argv wiring as other LC frontends.
process.argv.splice(2, 1, 'prerender')
await import('./server/start.js')
