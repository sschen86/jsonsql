const matchers = {}
class Matcher {
    constructor (key) {
        if (key) {
            matchers[key] = this
        }
        // console.info(`new ${this.constructor.name}`, key, this)
    }

    suffixNum (m, n) { // 匹配次数
        // ? = {0,1}
        // * = {0,Infinity}
        // + = {1,Infinity}
        // {m,n} = {m,n}
        this.m = m
        this.n = n
    }

    ruleScan (parentRuntime) {
        const thisRuntime = parentRuntime.createChild(this)
        const { sr } = thisRuntime

        let isSuccess = true
        const bIndex = sr.chIndex

        // 必选集
        sr.addRecord()
        for (let i = 0; i < this.m; i++) {
            if (!this.rule(sr)) {
                isSuccess = false
                sr.rollback()
                break
            }
        }
        sr.removeRecord()

        if (isSuccess) {
            // 贪婪集
            for (let i = this.m; i < this.n; i++) {
                const bIndex = sr.chIndex
                sr.addRecord()
                if (!this.rule(sr)) {
                    sr.rollback()
                    break
                }
                sr.removeRecord()

                // /A?B?AB/.test('AB')
                thisRuntime.createBacktracking({ bIndex, eIndex: sr.chIndex })
            }
            thisRuntime.resolve({ bIndex, eIndex: sr.chIndex })
        } else {
            thisRuntime.reject({ message: 'StringMatcher.scan出错', stack: [ this ] })
        }
    }
}

Matcher.prototype.m = Matcher.prototype.n = 1
Matcher.prototype._initGroupMatcher = (() => {
    let curMatcher
    const groupStack = []
    const ruleRegExp = RegExp([
        /'((?:[^']|\\\\|\\')+)'/, // 匹配字符串
        /<(\w+)>/, // 匹配link
        /(\()/, /(\))/, // 匹配分组
        /([?*+]|\{\d+\}|\{\d+,(?:\d+)?\}|\{,\d+\})/, // "?", "*", "+", "{n}", "{m,}", "{m,n}", "{,n}"
        /(\|)/, // "|"
    ].map(item => item.source).join('|'), 'g')

    const ruleParser = (
        all,
        matchString,
        matchLinkName,
        matchGroupOpen, matchGroupClose,
        matchSuffixNum,
        matchOr
    ) => {
        switch (false) {
            case !matchString: {
                curMatcher = getGroupStackEnd()
                const newMatcher = new StringMatcher(matchString)
                curMatcher.putChild(newMatcher)
                curMatcher = newMatcher
                break
            }
            case !matchLinkName: {
                curMatcher = getGroupStackEnd()
                const newMatcher = new LinkMatcher(matchLinkName)
                curMatcher.putChild(newMatcher)
                curMatcher = newMatcher
                break
            }
            case !matchGroupOpen: {
                curMatcher = getGroupStackEnd()
                const newMatcher = new GroupMatcher()
                curMatcher.putChild(newMatcher)
                curMatcher = newMatcher
                groupStack.push(curMatcher)
                break
            }
            case !matchGroupClose: {
                curMatcher = groupStack.pop()
                curMatcher.putOr(true)
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
                curMatcher = getGroupStackEnd()
                curMatcher.putOr()
                break
            }
        }
    }

    return function (key, source) {
        const type = typeof source
        if (type === 'string') {
            curMatcher = this._group = new GroupMatcher(key)
            groupStack.push(curMatcher)
            source.replace(/\/\/\/|\/\*[\w\W]*\*\//g, '').replace(ruleRegExp, ruleParser)
            curMatcher = groupStack.pop()
            curMatcher.putOr(true)
        } else if (type === 'function') {
            curMatcher = this._group = new GroupMatcher(key)
            curMatcher.putChild(new RuleMatcher(source, key))
            curMatcher.putOr(true)
        } else {
            throw Error(`Compiler.option.mathcers.${this.key}.source must be a function or string`)
        }
    }

    function getGroupStackEnd () {
        return groupStack[groupStack.length - 1]
    }
})()


class RuleMatcher extends Matcher {
    constructor (rule, key) {
        super(key)
        this.key = key
        this.rule = rule
    }

    scan (parentRuntime) {
        this.ruleScan(parentRuntime)
    }
}

class HookMatcher extends Matcher {
    constructor (key, option, compiler) {
        super(key)
        this.key = key
        this.hooks = { before: option.before, done: option.done }
        this._initGroupMatcher(this.key, option.source)
    }

    scan (parentRuntime) {
        this._group.scan(parentRuntime.createChild(this))
    }

    reject (thisRuntime, error) {
        thisRuntime.parent.reject(error)
    }

    resolve (thisRuntime) {
        thisRuntime.parent.resolve({ bIndex: thisRuntime.bIndex, eIndex: thisRuntime.eIndex })
    }
}

class StringMatcher extends Matcher {
    constructor (string) {
        super()
        this._string = string
    }

    rule (sr) {
        const text = this._string
        for (let i = 0, lg = text.length; i < lg; i++) {
            if (sr.read() !== text[i]) {
                return false
            }
        }
        return true
    }

    scan (parentRuntime) {
        this.ruleScan(parentRuntime)
    }
}

class GroupMatcher extends Matcher {
    constructor () {
        super()
        this.orFirstChild = null
        this._temp = { orChild: null, andChild: null }
    }

    putChild (matcher) {
        if (this._temp.orChild) { // 已经存在or节点
            const { andChild } = this._temp
            // 继续添加and子节点
            if (andChild) {
                andChild.nextSibling = matcher
                matcher.previousSibling = andChild
                this._temp.andChild = matcher
            } else {
                const { orChild } = this._temp
                this._temp.orChild = orChild.nextSibling = {
                    andFirstChild: this._temp.andChild = matcher,
                }
            }
        } else {
            this.orFirstChild = this._temp.orChild = {
                andFirstChild: this._temp.andChild = matcher,
            }
        }
        matcher.parentNode = this
        this._temp.andChild.orParent = this._temp.orChild // 子级链回父级or，回溯的使用使用
    }

    putOr (isClosed) {
        if (isClosed) {
            delete this._temp
        } else {
            this._temp.andChild = null
        }
    }

    scan (parentRuntime) {
        const { orFirstChild } = this
        const { andFirstChild } = orFirstChild
        andFirstChild.scan(parentRuntime.createChild(this, { orChild: orFirstChild, andChild: andFirstChild }))
    }

    resolve (childRuntime, thisRuntime) {
        thisRuntime.appendChild(childRuntime)

        // 继续处理子节点的扫描
        if (thisRuntime.andChild.nextSibling) {
            thisRuntime.andChild = thisRuntime.andChild.nextSibling
            thisRuntime.andChild.scan(thisRuntime)
        } else {
            thisRuntime.resolve({ bIndex: thisRuntime.bIndex, eIndex: thisRuntime.eIndex })
        }
    }

    // 回溯触发的完成，这个时候需要把当前子级后面的节点移除
    backtrackingResolve (childRuntime, error) {
        const thisRuntime = childRuntime.parent
        thisRuntime.setLastChild(childRuntime)
        thisRuntime.andChild = childRuntime.matcher
        thisRuntime.orChild = thisRuntime.andChild.orParent

        // 继续处理子节点的扫描
        if (thisRuntime.andChild.nextSibling) {
            thisRuntime.andChild = thisRuntime.andChild.nextSibling
            thisRuntime.andChild.scan(thisRuntime)
        } else if (thisRuntime.orChild.nextSibling) {
            // 存在“或分支”
            thisRuntime.orChild = thisRuntime.orChild.nextSibling
            thisRuntime.andChild = thisRuntime.orChild.andFirstChild
            thisRuntime.andChild.scan(thisRuntime)
        } else {
            thisRuntime.reject(error)
        }
    }

    reject (childRuntime, error) {
        const thisRuntime = childRuntime.parent
        // BAA
        //  /[AB]?(A?B|AA)/
        if (thisRuntime.backtrackingStack) {
            // 存在回溯点
            this.backtrackingResolve(thisRuntime.popBacktracking(), error)
        } else if (thisRuntime.orChild.nextSibling) {
            // 存在“或分支”
            thisRuntime.orChild = thisRuntime.orChild.nextSibling
            thisRuntime.andChild = thisRuntime.orChild.andFirstChild
            thisRuntime.andChild.scan(thisRuntime)
        } else {
            // 失败了
            thisRuntime.reject(error)
        }
    }
}

class LinkMatcher extends Matcher {
    constructor (linkName) {
        super()
        this.name = linkName
    }

    scan (parentRuntime) {
        const oringinMatcher = matchers[this.name] // 原始的匹配器

        // 仅一项
        if (this.m === 1 && this.n === 1) {
            return oringinMatcher.scan(parentRuntime)
        }

        const thisRuntime = parentRuntime.createChild(this)
        this.isSuccess = true
        for (let i = 0; i < this.m; i++) {
            oringinMatcher.scan(thisRuntime)
            if (!this.isSuccess) {
                break
            }
        }


        console.info('#########', matchers[this.name], this)
        //  this.ruleScan(parentRuntime)
    }

    resolve (childRuntime, thisRuntime) {
        throw Error('LinkMatcher.resolve')
    }

    reject () {
        throw Error('LinkMatcher.reject')
    }
}


module.exports = { RuleMatcher, HookMatcher }
