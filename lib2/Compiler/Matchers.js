
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
}

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
        this._child = this._parseSource(id, source)
        matchers[id] = this
    }

    scan (parentRuntime) {
        console.info({ parentRuntime })
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
}

class GroupMatcher extends Matcher {
    constructor () {
        super()
        this._tempOr = null
        this._tempAnd = null
        this._orFirstChild = null
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
}
class LinkMatcher extends Matcher {
    constructor (id) {
        super()
        this._id = id
    }
}
class RuleMatcher extends Matcher {
    constructor (id, match) {
        super()
        this._id = id
        this._match = match
        matchers[id] = this
    }
}

class StringMatcher extends Matcher {
    constructor (stringValue) {
        super()
        this._stringValue = stringValue
    }

    _match (sr) {
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
