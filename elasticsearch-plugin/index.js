const { Client: ElasticSearch } = require('@elastic/elasticsearch')
const AnalyticsWriter = require('./lib/AnalyticsWriter.js')
const updater = require('./lib/updater.js')
const searchIndex = require('./lib/searchIndex.js')
const indexProcess = require('./lib/process.js')

module.exports = function(app, services) {
  const env = process.env
  app.connectToSearch = () => {
    if(!env.SEARCH_INDEX_PREFIX) throw new Error("ElasticSearch not configured")
    if(app.search) return app.search
    app.searchIndexPrefix = env.SEARCH_INDEX_PREFIX
    app.search = new ElasticSearch({ node: env.SEARCH_URL || 'http://localhost:9200' })
    //this.search.info(console.log)
    return app.search
  }

  app.connectToAnalytics = () => {
    if(!env.ANALYTICS_INDEX_PREFIX) throw new Error("ElasticSearch analytics not configured")
    if(app.analytics) return app.analytics
    app.analytics = new AnalyticsWriter(env.ANALYTICS_INDEX_PREFIX)
    return app.analytics
  }

  if(env.SEARCH_INDEX_PREFIX) app.defaultProcessors.push(searchIndex)
  if(env.SEARCH_INDEX_PREFIX) app.defaultUpdaters.push(updater)
  if(env.SEARCH_INDEX_PREFIX) app.defaultProcesses.push(indexProcess)
}
