const Runtime = require('./Runtime')
const { RootMatcher } = require('./Matchers')

module.exports = scanner

function scanner (code) {
    const [ BOF, EOF, EOL ] = [ {}, {}, '\n' ]
    const [ chAlls, chMaps ] = [ [], [] ]

    // 初始化代码数据
    ;(() => {
        let lineNum = -1 // 原始行标，因为要对空行进行过滤
        code.split(/\r\n?|\r?\n/).forEach(line => {
            line = line.trim()
            lineNum++

            if (!line) {
                return
            }

            let document
            line = line.replace(/\/\/(\/)? .+/, (matched, isDocument) => {
                if (isDocument) {
                    document = matched
                }
                return ''
            }).trim()

            if (!line) {
                return
            }

            const bIndex = chAlls.length
            chAlls.push(...line.split(''), '\n')
            const eIndex = chAlls.length
            chMaps.push([ lineNum, bIndex, eIndex, document ])
        })
    })()

    const recordStack = []
    const sr = {
        EOF,
        EOL,
        chIndex: 0,
        chNow: BOF,
        notEOF: () => sr.chIndex < chAlls.length,
        use (matcher) {
            // console.info('use', sr.chIndex, chAlls)

            matcher.scan(new Runtime(null, new RootMatcher((thisRuntime) => {
                // console.info('resolve===', thisRuntime)
            }, (thisRuntime, error) => {
                console.info(thisRuntime, error)
                throw Error('解析出错啦')
            }), { sr }))
        },
        read: () => {
            if (sr.chIndex === chAlls.length) { // 处于文件结尾
                throw Error('ch已经到达结尾')
            }
            return sr.chNow = chAlls[sr.chIndex++]
        },
        back: () => sr.chNow = chAlls[--sr.chIndex],
        error (err) {
            console.error(err)
        },
        moveTo: (chIndex) => sr.chNow = chAlls[sr.chIndex = chIndex],
        createRecord: () => recordStack.push(sr.chIndex),
        removeRecord: () => recordStack.pop(),
        rollback: () => sr.moveTo(recordStack.pop()),
        text: (bIndex, eIndex) => chAlls.slice(bIndex, eIndex).join(''),
    }

    return sr
}
