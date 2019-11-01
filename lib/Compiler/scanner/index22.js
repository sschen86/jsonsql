const treeBuilder = require('./treeBuilder')

module.exports = scanner

function scanner (code) {
    const [ EOF, EOL, BOF ] = [ { EOF: true }, '\n', { BOF: true } ]
    let { chIndex, chNow, chAlls, sourceMap } = parseCode(code)
    console.info({ chIndex, chNow, chAlls, sourceMap })

    const sr = {
        EOL,
        EOF, // stat,
        read: chRead,
        back: chBack,
        notEOF: () => chIndex < chAlls.length,
        notEOL: () => chNow !== EOL,
        use (regExpNode) {
            return (new Matcher(regExpNode)).scan()
        },
        error (err) {
            try {
                const chIndex = err.chIndex
                const codeObj = codeInfo(chIndex)
                const text = chAlls.slice(...codeObj.range).join('')
                return { row: codeObj.row + 1, col: codeObj.col, text }
            } catch (e) {
                throw err
            }
        },
        tree () {
            const tb = treeBuilder()
            expandTree(rootMatcher, tb)
            return tb.getValue()

            function expandTree (matcher, tb) {
                if (!matcher) {
                    return
                }

                const regExpNode = matcher.regExpNode
                let originalNode, text
                if (regExpNode.isLink) {
                    text = chAlls.slice(matcher.bIndex, matcher.eIndex).join('')
                    originalNode = regExpNode.getOriginal()
                    originalNode.before && originalNode.before(tb, text)
                    originalNode.document && originalNode.document(tb, codeInfo(matcher.bIndex).document)
                }

                if (matcher.firstMatcher) {
                    expandTree(matcher.firstMatcher, tb)
                }

                if (originalNode) {
                    originalNode.done && originalNode.done(tb, text)
                    // console.info('after.key =>', regExpNode.key)
                }

                if (matcher.nextMatcher) {
                    expandTree(matcher.nextMatcher, tb)
                }
            }
        },
    }

    const MatcherMax = Infinity
    let MatcherPID = 0
    // let matcherLoggerIndent = 0
    let curMatcher, rootMatcher
    let curLinkId
    let matcherLoggerLength = 0
    const matcherLoggerMax = Infinity

    const backtrackingStack = [] // 贪婪回溯栈

    let scanIsRun = false
    let contextArgs
    let contextThat

    Matcher.prototype = {

        constructor: Matcher,

        scan: loopScan(function () { // 枝匹配器执行扫描任务
            ;(new Matcher(this._curOr.firstAnd, this)).run()
        }),

        run () { // 执行匹配器
            let regExpNode = this.regExpNode

            if (regExpNode.proxyNode) {
                regExpNode = regExpNode.proxyNode()
                if (!regExpNode) {
                    return
                }
            }

            if (regExpNode.rule) {
                this.match()
            } else {
                this.scan()
            }
        },

        runNext (modeBacktracking) { // 调用下一个匹配器（优先级：自己的下一个分量匹配器，弟匹配器，父匹配器的下一个匹配器）
            let selfScanEnabled
            if (modeBacktracking) { // 回溯模式不允许使用贪婪模式的分量
                selfScanEnabled = this._scanNum < this.m
            } else {
                selfScanEnabled = this._scanNum < this.n
            }

            if (selfScanEnabled && !this._moderule) { // 存在分量可用
                (new Matcher(this.regExpNode, this.parentMatcher, { scanNum: this._scanNum + 1 })).scan()
            } else if (this.regExpNode.nextAnd) { // 弟匹配器
                (new Matcher(this.regExpNode.nextAnd, this.parentMatcher)).run()
            } else if (this.parentMatcher) {
                this.parentMatcher.runNext()
            } else {
                throw { message: 'runNext' }
            }
        },

        nextOr () {
            if (this.firstMatcher) {
                chIndex = this.firstMatcher.bIndex
            }
            this.firstMatcher = this.lastMatcher = this._curMatcher = null
            // console.info('nextOr', this, this._curOr)
            this._curOr = this._curOr.nextOr
            this.scan()
        },

        match () { // 进行规则匹配
            this.matcherLogger('beginMatch')
            this.matcherLogger('matchText', { chIndex, text: chBlock(chIndex, chIndex + 60).text })

            let isSuccess = true
            const bIndex = chIndex
            let regExpNode = this.regExpNode

            if (regExpNode.proxyNode) {
                regExpNode = regExpNode.proxyNode()
            }

            // 必选集
            for (let i = 0; i < this.m; i++) {
                const backIndex = chIndex
                if (!regExpNode.rule(sr)) {
                    chIndex = backIndex
                    isSuccess = false
                    break
                }
            }

            if (isSuccess) {
                // 贪婪集
                for (let i = this.m; i < this.n; i++) {
                    const backIndex = chIndex
                    if (!regExpNode.rule(sr)) {
                        chIndex = backIndex
                        break
                    }
                    this.greedys = this.greedys || []
                    this.greedys.push({ bIndex: backIndex, eIndex: chIndex })
                }

                this.bIndex = bIndex
                this.eIndex = chIndex
                this._modeGreedy = !!this.greedys
                this._moderule = true


                this.matcherLogger('endMatch.success', chBlock(bIndex, chIndex))
                this.success()
            } else {
                this.matcherLogger('endMatch.failure', chBlock(bIndex, chIndex))
                this.failure()
            }
        },

        failure (originalFailureMatcher) {
            if (this.stopPropagation && this.firstMatcher) { // 已经存在成功的子匹配，并且不允许冒泡回退
                throw { originalFailureMatcher: originalFailureMatcher || this, message: 'failure,未发现parentMatcher', chIndex }
            }

            if (this._modeGreedy) { // 贪婪模式下，则进入成功
                this._empty = true // 终止贪婪匹配
                if (this.firstMatcher) { // 假如子级存在成功的匹配，用第一个子级进行回退
                    chIndex = this.firstMatcher.bIndex
                }
                this.success()
            } else {
                const backtrackingNode = backtrackingStack[backtrackingStack.length - 1]
                const parentMatcher = this.parentMatcher
                if (!parentMatcher) {
                    throw { originalFailureMatcher: originalFailureMatcher || this, message: 'failure,未发现parentMatcher', chIndex }
                }

                if (backtrackingNode) { // 存在回溯点
                    const backtrackingMatcher = backtrackingNode.matcher
                    if (parentMatcher._curOr.nextOr) { // 存在or分支
                        if (parentMatcher.ancestorOf(backtrackingMatcher)) { // 回溯点相同祖先，优先使用回溯点
                            backtrackingMatcher.backtracking()
                        } else {
                            parentMatcher.nextOr()
                        }
                    } else {
                        if (parentMatcher.ancestorOf(backtrackingMatcher)) { // 仅可以使用相同祖先的回溯点
                            backtrackingMatcher.backtracking()
                        } else {
                            parentMatcher.failure()
                        }
                    }
                } else {
                    if (parentMatcher._curOr.nextOr) { // 存在or分支
                        parentMatcher.nextOr()
                    } else {
                        parentMatcher.failure(this)
                    }
                }
            }
        },

        success () {
            if (this._modeLink) {
                const linkId = this.MatcherPID
                while (backtrackingStack.length) {
                    if (backtrackingStack[backtrackingStack.length - 1].curLinkId === linkId) { // 假如当前linkNode已经完成扫描，则移除它内部的回溯点
                        backtrackingStack.pop()
                    } else {
                        break
                    }
                }
            }

            const parentMatcher = this.parentMatcher
            if (!parentMatcher) { // 没有上一级匹配器
                return false
            }

            if (this._empty) { // 贪婪匹配失败的情况下
                if (this.regExpNode.nextAnd) { // 存在弟节点
                    (new Matcher(this.regExpNode.nextAnd, parentMatcher)).run()
                } else { // 回归父节点，说明父节点完成了一轮扫描
                    if (parentMatcher._curMatcher) {
                        parentMatcher.lastMatcher = parentMatcher._curMatcher
                        parentMatcher.bIndex = parentMatcher.firstMatcher.bIndex
                        parentMatcher.eIndex = parentMatcher.lastMatcher.eIndex
                    } else {
                        parentMatcher.firstMatcher = parentMatcher.lastMatcher = null
                        parentMatcher.bIndex = parentMatcher.eIndex = chIndex
                    }
                    parentMatcher._curMatcher = null
                    parentMatcher.success()
                }
            } else {
                if (parentMatcher._curMatcher) {
                    parentMatcher._curMatcher.nextMatcher = this
                    this.prevMatcher = parentMatcher._curMatcher
                } else {
                    parentMatcher.firstMatcher = this
                }
                parentMatcher._curMatcher = this

                if (!this._originalGreedyMatcher) { // 非贪婪模式下会尝试生成缓冲区
                    if (this._modeGreedy && !this._modeLink) {
                        backtrackingStack.push({ matcher: this, curLinkId })
                    }
                }
                if (this._scanNum < this.n && this._curOr) { // 非叶类型，继续使用分量
                    // @ts-ignore
                    (new Matcher(this.regExpNode, parentMatcher, { scanNum: this._scanNum + 1 })).scan()
                } else if (this.regExpNode.nextAnd) { // 存在弟节点
                    // @ts-ignore
                    (new Matcher(this.regExpNode.nextAnd, parentMatcher)).run()
                } else { // 回归父节点，说明父节点完成了一轮扫描
                    parentMatcher.bIndex = parentMatcher.firstMatcher.bIndex
                    parentMatcher.eIndex = this.eIndex
                    parentMatcher.lastMatcher = this
                    parentMatcher._curMatcher = null
                    parentMatcher.success()
                }
            }
        },

        backtracking () {
            this.matcherLogger('beginBacktracking')
            if (this._moderule) { // 规则模式
                chIndex = this.eIndex = this.greedys.pop().bIndex
                if (!this.greedys.length) { // 没有缓冲区，则从栈中移除
                    this._modeGreedy = false
                    backtrackingStack.pop()
                }
            } else {
                chIndex = this.bIndex
                backtrackingStack.pop()
            }
            this.destroyAfterMatcher(true)
            this.matcherLogger('endBacktracking')
            this.runNext(true)
        },

        ancestorOf (matcher) {
            let parentMatcher = matcher
            while (true) {
                parentMatcher = parentMatcher.parentMatcher
                if (parentMatcher === this) {
                    return true
                } else if (!parentMatcher) {
                    return false
                }
            }
        },

        destroyAfterMatcher (isSelf) { // 销毁右侧的匹配结果
            const parentMatcher = this.parentMatcher

            if (this._moderule) { // 规则模式
                if (this.nextMatcher) {
                    this.nextMatcher = null
                    parentMatcher._curMatcher = this
                    parentMatcher.lastMatcher = null
                    parentMatcher.eIndex = null
                } else { // 为最后一个节点
                    parentMatcher.lastMatcher = this
                    parentMatcher.eIndex = chIndex
                }
                parentMatcher.destroyAfterMatcher()
            } else if (parentMatcher) {
                if (isSelf) { // isSelf代表回溯节点的消除
                    const prevMatcher = this.prevMatcher
                    if (prevMatcher) { // 存在上一个
                        prevMatcher.nextMatcher = null
                        parentMatcher._curMatcher = prevMatcher
                        parentMatcher.lastMatcher = prevMatcher
                        parentMatcher.eIndex = chIndex
                    } else { // 为首节点
                        parentMatcher.firstMatcher = parentMatcher.lastMatcher = null
                        parentMatcher.eIndex = chIndex
                    }
                    parentMatcher.destroyAfterMatcher()
                } else { // 父层仅需消除右侧的即可
                    if (this.nextMatcher) {
                        this.nextMatcher = null
                        parentMatcher._curMatcher = this
                        parentMatcher.lastMatcher = this
                        parentMatcher.eIndex = chIndex
                    } else { // 为最后一个节点
                        parentMatcher.eIndex = chIndex
                    }
                    parentMatcher.destroyAfterMatcher()
                }
            }
        },
        matcherLogger (loggerType) {
            return
            if (matcherLoggerLength >= matcherLoggerMax) {
                throw { message: 'matcherLogger超出最大限制', rootMatcher }
            }
            matcherLoggerLength++

            const MatcherPID = `(MatcherPID:${this.MatcherPID})`
            // @ts-ignore
            loggerType = loggerType.replace(/(begin|end)(Scanback|Scan|Match|TryScanback|ChIndexBack|Backtracking|Match|Backtracking)/, (source, type, name) => {
                if (type === 'begin') {
                    if (name === 'Scan') {
                        console.group(name + MatcherPID)
                    } else {
                        console.group(name + MatcherPID)
                    }
                    return '#'
                } else if (type === 'end') {
                    console.groupEnd()
                    return `##${name}${MatcherPID}`
                }
            })

            if (loggerType.charAt(0) !== '#') {
                console.log.apply(null, arguments)
            } else if (loggerType.charAt(1) === '#') {
                loggerType = loggerType.substr(2)
                console.log.apply(null, arguments)
            }
        },

    }

    return sr

    function loopScan (matcherScan) {
        return function () {
            contextArgs = arguments
            contextThat = this
            if (!scanIsRun) {
                scanIsRun = true
                while (contextArgs) {
                    const args = contextArgs
                    contextArgs = null
                    matcherScan.apply(contextThat, args)
                }
                scanIsRun = false
            }
        }
    }
    function Matcher (regExpNode, parentMatcher, option) {
        this.MatcherPID = MatcherPID++

        if (MatcherPID > MatcherMax) {
            throw { parentMatcher, message: 'MatcherMax做了限制' }
        }

        this.matcherLogger('create', this)

        this.regExpNode = regExpNode
        this.m = regExpNode.m
        this.n = regExpNode.n
        this.stopPropagation = regExpNode.stopPropagation
        // this.greedys = null
        option = option || {}

        this._scanNum = option.scanNum || 1
        this._curOr = option.curOr || regExpNode.childOr
        this._curMatcher = null
        this._modeGreedy = this._scanNum > this.m // 贪婪模式

        // this.firstMatcher = null
        // this.lastMatcher = null


        if (regExpNode.key) { // LinkNode
            if (regExpNode.proxyNode) {
                this._curOr = option.curOr || (regExpNode.proxyNode().childOr)
                this.stopPropagation = regExpNode.proxyNode().stopPropagation
            }
            this._modeLink = true
            curLinkId = this.MatcherPID
        }


        if (parentMatcher) {
            this.parentMatcher = parentMatcher
            this._originalGreedyMatcher = parentMatcher._modeGreedy ? parentMatcher : parentMatcher._originalGreedyMatcher // 贪婪模式的来源
        } else {
            if (curMatcher) {
                curMatcher.nextMatcher = this
            } else {
                rootMatcher = this
            }
            curMatcher = this
        }
    }

    function chRead () {
        if (chIndex === chAlls.length) { // 处于文件结尾
            throw { message: 'ch已经到达结尾', chIndex }
        }

        chNow = chAlls[chIndex++]

        return chNow
    }
    function chBack () {
        chNow = chAlls[--chIndex]
    }
    function chBlock (bIndex, eIndex) {
        return {
            bIndex, eIndex, chIndex, text: chAlls.slice(bIndex, eIndex).join(''),
        }
    }

    function parseCode (code) {
        const chIndex = 0
        const chNow = BOF
        let chAlls = []
        const sourceMap = []

        let lineNum = -1 // 原始行标，因为要对空行进行过滤

        code.split(/\r\n?|\r?\n/).forEach(line => {
            line = line.trim()
            lineNum++

            if (!line) {
                return
            }

            let docLine // 对文档进行解析
            line = line
                .replace(/\/\/\/ .+/, (source, isDocLine) => {
                    if (isDocLine) {
                        docLine = source.replace(/("|\\)/g, '\\$1') // 双引号，反斜杠进行转义
                    }
                    return ''
                })
                .trim()

            if (!line) {
                return
            }

            const bIndex = chAlls.length
            chAlls = chAlls.concat((`${line}\n`).split(''))
            const eIndex = chAlls.length

            sourceMap.push([ lineNum, bIndex, eIndex, docLine ])
        })

        return {
            chIndex, chNow, chAlls, sourceMap,
        }
    }

    function codeInfo (index) {
        const map = sourceMap
        const mapLength = map.length - 1

        let bSection = 0
        let eSection = mapLength
        let nSection = bSection
        let i = 1000 // 越界中断标识
        while (i--) {
            // nSection = Math.ceil((bSection + eSection) / 2)

            const item = map[nSection] // 二分法取值
            const bIndex = item[1]
            const eIndex = item[2]

            // console.info({ nSection, index, bIndex, eIndex })

            if (index >= bIndex && index < eIndex) {
                return {
                    item,
                    range: item.slice(1, 3),
                    row: item[0], // 行
                    col: index - bIndex, // 列
                    document: item[3], // 文档
                }
            } else if (index < bIndex) { // 向前搜
                eSection = nSection
                nSection = Math.floor((eSection + bSection) / 2) // 把当前值作为结束区间
            } else { // 向后搜
                bSection = nSection
                nSection = Math.ceil((eSection + bSection) / 2) // 把当前值作为开始区间
            }
        }
    }
}
