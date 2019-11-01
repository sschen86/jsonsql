module.exports = scanner


function scanner (code) {
    const [ BOF, EOF, EOL ] = [ {}, {}, '\n' ]
    let [ chNow, chIndex, chAlls, chMaps ] = [ BOF, -1, [], [] ]

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

    const scanner = {
        notEOF: () => chIndex < chAlls.length,
        use (ruleNode) {
            return (new Matcher(ruleNode)).scan()
        },
        error (err) {
            console.error(err)
        },
    }

    chNow = 2

    const runtime = { rootMatcher: null, curMatcher: null, curLinkId: null, MatcherPID: 1 }


    console.info({ chNow, chIndex, chAlls, chMaps })


    return scanner
}
