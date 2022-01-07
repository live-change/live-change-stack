const path = require('path')
const apiUrl = process.env.DB_SERVER || 'http://localhost:' + (process.env.DB_PORT || 9417)
console.log("Api server url:", apiUrl)

module.exports = {
  devServer: {
    proxy: {
      '^/api': {
        target: apiUrl,
        ws: true
      }
    },
    port: process.env.ADMIN_PORT || 8417,
  },
  configureWebpack: {
    devtool: 'source-map',
    resolve: {
      alias: {
        "api": path.resolve(__dirname, 'src/api/index.js'),
        'i18n': path.resolve(__dirname, 'src/i18n'),
        moment$: path.resolve(__dirname, "../node_modules/moment/moment.js"),
        analytics: path.resolve(__dirname, 'src/analytics-client.js'),
      },
      symlinks: false
    }
  }
}
