const path = require('path')

module.exports = {
    entry: './demo.js',
    output: {
        path: path.resolve(__dirname, 'demo'),
        filename: 'index.js',
    },
}
