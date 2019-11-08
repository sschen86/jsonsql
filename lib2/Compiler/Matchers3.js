
const logger = {
    created: false, // 创建匹配器时
}

const matchers = {}
class Matcher {
    constructor () {
        logger.created && (console.warn(`new ${this.constructor.name}`, this))
    }

    suffixNum (m, n) { // 匹配次数
        // ? = {0,1}
        // * = {0,Infinity}
        // + = {1,Infinity}
        // {m,n} = {m,n}
        this.m = m
        this.n = n
    }

    scan () {
        throw Error(`Matcher.scan must be override by ${this.constructor.name}.scan`)
    }

    resolve () {
        throw Error(`Matcher.resolve must be override by ${this.constructor.name}.resolve`)
    }

    reject () {
        throw Error(`Matcher.reject must be override by ${this.constructor.name}.reject`)
    }

    // 扫描真实的，非引用类型
    scanRealMatcher (thisRuntime) {
        for (let i = 0; i < this.m; i++) {
            if (!thisRuntime.scanRealMatcher()) {
                break
            }
        }

        if (thisRuntime.isSuccess) {
            // 贪婪集
            for (let i = this.m; i < this.n; i++) {
                if (!thisRuntime.scanRealMatcher(false)) {
                    break
                }
            }
        }
    }
}

class Matcher2 {
    constructor () {
        logger.created && (console.warn(`new ${this.constructor.name}`, this))
    }

    suffixNum (m, n) { // 匹配次数
        // ? = {0,1}
        // * = {0,Infinity}
        // + = {1,Infinity}
        // {m,n} = {m,n}
        this.m = m
        this.n = n
    }

    scan () {
        throw Error(`Matcher.scan must be override by ${this.constructor.name}.scan`)
    }

    // 扫描自己所有的分量{m,n}
    scanAll (thisRuntime) {
        for (let i = 0; i < this.n; i++) {
            this.scanActivedMatcher(thisRuntime)
        }
    }

    // 所有的resolve和reject都是从根matcher抛出，中间级仅触发扫描
    scanActivedMatcher (thisRuntime) {
        for (let i = 0; i < this.m; i++) {
            if (!thisRuntime.scan()) {
                break
            }
        }

        if (thisRuntime.isSuccess) {
            // 贪婪集
            for (let i = this.m; i < this.n; i++) {
                if (!thisRuntime.scan(false)) {
                    break
                }
            }
        }
    }


    // StringMatcher, RulerMatcher会触发resolve和reject，isRequired表示当前的匹配是否是必选的
    match (thisRuntime, isRequired) {
        const { sr } = thisRuntime
        const bIndex = sr.chIndex
        let isSuccess = true

        // 扫描必选集
        sr.addRecord()
        for (let i = 0; i < this.m; i++) {
            if (!this._match(sr)) {
                isSuccess = false
                break
            }
        }
        if (isSuccess) {
            sr.removeRecord() // 销毁扫描器记录
            // 贪婪集
            for (let i = this.m; i < this.n; i++) {
                if (!this._match(sr)) {
                    break
                }
            }
            thisRuntime.resolve(bIndex, sr.chIndex)
        } else {
            sr.rollback() // 恢复扫描器记录
            isRequired && thisRuntime.reject({ bIndex, matcher: this })
        }
    }


    resolve () {
        throw Error(`Matcher.resolve must be override by ${this.constructor.name}.resolve`)
    }

    resolveThis (thisRuntime) {
        // 存在兄弟节点，则继续扫描，否则触发父节点resolve
        if (this.nextSibling) {
            this.nextSibling.scan(thisRuntime.parent)
        } else {
            thisRuntime.parent.resolve()
        }
    }

    reject2 () {
        throw Error(`Matcher.reject must be override by ${this.constructor.name}.reject`)
    }
}
Matcher.prototype.m = Matcher.prototype.n = 1

class RootMatcher {
    constructor (resolve, reject) {
        this.resolve = resolve
        this.reject = reject
    }
}

class HookMatcher extends Matcher {
    constructor (id, { before, done, source }) {
        super()
        this._id = id
        this._hooks = { before, done }
        this._source = source
        this._realMatcher = this._parseSource(id, source)
        matchers[id] = this
    }

    _parseSource (id, source) {
        let curMatcher
        if (typeof source === 'function') {
            curMatcher = new GroupMatcher(id)
            curMatcher.putChild(new RuleMatcher(id, source))
            curMatcher.putEnd()
            return curMatcher
        }

        const groupStack = []
        const groupParserRegExp = RegExp([
            /'((?:[^']|\\\\|\\')+)'/, // 匹配字符串
            /<(\w+)>/, // 匹配link
            /(\()/, /(\))/, // 匹配分组
            /([?*+]|\{\d+\}|\{\d+,(?:\d+)?\}|\{,\d+\})/, // "?", "*", "+", "{n}", "{m,}", "{m,n}", "{,n}"
            /(\|)/, // "|"
        ].map(item => item.source).join('|'), 'g')
        const groupStackTop = () => groupStack[groupStack.length - 1]
        const groupParser = (
            all,
            matchString,
            matchLinkName,
            matchGroupOpen, matchGroupClose,
            matchSuffixNum,
            matchOr
        ) => {
            switch (false) {
                case !matchString: {
                    curMatcher = groupStackTop()
                    const newMatcher = new StringMatcher(matchString)
                    curMatcher.putChild(newMatcher)
                    curMatcher = newMatcher
                    break
                }
                case !matchLinkName: {
                    curMatcher = groupStackTop()
                    const newMatcher = new LinkMatcher(matchLinkName)
                    curMatcher.putChild(newMatcher)
                    curMatcher = newMatcher
                    break
                }
                case !matchGroupOpen: {
                    curMatcher = groupStackTop()
                    const newMatcher = new GroupMatcher()
                    curMatcher.putChild(newMatcher)
                    curMatcher = newMatcher
                    groupStack.push(curMatcher)
                    break
                }
                case !matchGroupClose: {
                    curMatcher = groupStack.pop()
                    curMatcher.putEnd()
                    break
                }
                case !matchSuffixNum: {
                    switch (matchSuffixNum) {
                        case '?': {
                            curMatcher.suffixNum(0, 1)
                            break
                        }
                        case '*': {
                            curMatcher.suffixNum(0, Infinity)
                            break
                        }
                        case '+': {
                            curMatcher.suffixNum(1, Infinity)
                            break
                        }
                        default: {
                            matchSuffixNum = matchSuffixNum.slice(1, -1).split(',')
                            if (matchSuffixNum.length === 1) {
                                curMatcher.suffixNum(+matchSuffixNum[0], +matchSuffixNum[0])
                            } else {
                                curMatcher.suffixNum(+matchSuffixNum[0] || 0, +matchSuffixNum[1] || Infinity)
                            }
                        }
                    }
                    break
                }
                case !matchOr: {
                    curMatcher = groupStackTop()
                    curMatcher.putOr()
                    break
                }
            }
        }

        if (typeof source === 'string') {
            curMatcher = new GroupMatcher(id)
            groupStack.push(curMatcher)
            source.replace(/\/\/\/|\/\*[\w\W]*\*\//g, '').replace(groupParserRegExp, groupParser)
            curMatcher = groupStack.pop()
            curMatcher.putEnd()
            return curMatcher
        }

        throw Error(`Compiler.option.mathcers.${this.key}.source must be a function or string`)
    }

    scan (parentRuntime) {
        this._realMatcher.scan(parentRuntime.createChild(this))
    }

    resolve2 (thisRuntime) {
        this.resolveThis(thisRuntime)
    }
}

class GroupMatcher extends Matcher {
    constructor () {
        super()
        this._tempOr = null
        this._tempAnd = null
        this._orFirstChild = null
    }

    continue () {

    }


    // 插入子级
    putChild (matcher) {
        const { _tempOr, _tempAnd } = this
        if (_tempOr) { // 已经存在or节点
            // 继续添加and节点
            if (_tempAnd) {
                _tempAnd.nextSibling = matcher
                matcher.previousSibling = _tempAnd
                this._tempAnd = matcher
            } else {
                this._tempOr = _tempOr.nextSibling = {
                    andFirstChild: this._tempAnd = matcher,
                }
            }
        } else {
            this._orFirstChild = this._tempOr = {
                andFirstChild: this._tempAnd = matcher,
            }
        }
        matcher.parentNode = this
        this._tempAnd.groupParent = this._tempOr // 子级链回父级分组or，回溯的使用使用
    }

    putOr () {
        this._tempAnd = null
    }

    putEnd () {
        delete this._tempOr
        delete this._tempAnd
    }

    scan (parentRuntime) {
        this._orFirstChild.andFirstChild.scan(parentRuntime.createChild(this))
    }


    resolve222 (thisRuntime) {
        // this.resolveThis(thisRuntime)
    }
}


class LinkMatcher extends Matcher {
    constructor (id) {
        super()
        this._id = id
    }

    scan (parentRuntime) {
        const thisRuntime = parentRuntime.createChild(this)
        for (let i = 0; i < this.m; i++) {
            matchers[this._id].scan(thisRuntime)
        }
        for (let i = this.m; i < this.n; i++) {
            matchers[this._id].scan(thisRuntime)
        }
    }

    resolve (thisRuntime) {
        thisRuntime.matches++
        // 完成所有匹配
        if (thisRuntime.matches === this.n) {
            this.resolveAll(thisRuntime)
        }
    }

    reject (thisRuntime, error) {
        if (thisRuntime.matches >= this.m) {
            this.resolveAll(thisRuntime)
        } else {
            this.rejectAll(thisRuntime, error)
        }
    }

    resolveAll (thisRuntime) {
        console.info('LinkMatcher.resolveAll', thisRuntime)
    }

    rejectAll (thisRuntime, error) {
        console.info('LinkMatcher.rejectAll', thisRuntime)
    }

    resolve2 (thisRuntime) {
        throw Error('xx')
        console.info('resolve')
    // this.resolveThis(thisRuntime)
    }
}

class RuleMatcher extends Matcher {
    constructor (id, match) {
        super()
        this._id = id
        this._match = match
        matchers[id] = this
    }

    scan (parentRuntime) {
        const thisRuntime = parentRuntime.createChild(this)
        const { sr } = parentRuntime
        const bIndex = sr.chIndex
        sr.createRecord()
        if (this._match(sr)) {
            sr.removeRecord()
            thisRuntime.resolve(bIndex, sr.chIndex)
        } else {
            sr.rollback()
            thisRuntime.reject({ bIndex, stack: [ ] })
        }
    }

    resolve (thisRuntime) {
        thisRuntime.parent.resolve()
    }

    reject (thisRuntime, error) {
        error.stack.push(this)
        thisRuntime.parent.reject(error)
    }


    scan2 (parentRuntime) {
        this.match(parentRuntime.createChild(this, { activedMatcher: this }))
    }

    resolve2 (thisRuntime) {
        this.resolveThis(thisRuntime)
    }
}

class StringMatcher extends Matcher {
    constructor (stringValue) {
        super()
        this._stringValue = stringValue
    }

    scan2 (parentRuntime, isRequired) {
        this.match(parentRuntime.createChild(this, { activedMatcher: this }))
    }

    resolve2 (thisRuntime) {
        this.resolveThis(thisRuntime)
    }

    _match2 (sr) {
        const stringValue = this._stringValue
        for (let i = 0, lg = stringValue.length; i < lg; i++) {
            if (sr.read() !== stringValue[i]) {
                return false
            }
        }
        return true
    }
}


module.exports = {
    RootMatcher, RuleMatcher, HookMatcher,
}
