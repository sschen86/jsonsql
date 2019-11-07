const path = require('path')

module.exports = {
    entry: './demo.js',
    output: {
        path: path.resolve(__dirname, 'demo'),
        filename: 'index.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|demo)/, // 排除掉node_module目录
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [ '@babel/preset-env' ], // 转码规则
                        plugins: [
                            [ '@babel/plugin-proposal-class-properties', { loose: true } ],
                        ],
                    },
                },
            },
        ],
    },
}
