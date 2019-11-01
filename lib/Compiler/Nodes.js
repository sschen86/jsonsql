class BaseNode {
    constructor () {
        this.m = 1
        this.n = 1
        // this.modeLazy = false // 惰性模式
        // this.this.modeConsume = true // 消耗模式
        // this.modeNot = false // 非模式
        this.modeValue = false // 捕获取值
        this.init(...arguments)
    }

    suffixNum (m, n) { // 匹配次数
        // ? = {0,1}
        // * = {0,Infinity}
        // + = {1,Infinity}
        // {m,n} = {m,n}
        this.m = m
        this.n = n
    }

    setFlag (flag) {
        switch (flag) {
            case '?': {
                this.modeLazy = true
                break
            }
            case '!': {
                this.modeNot = true
                break
            }
            case '==': {
                this.modeConsume = false
                break
            }
            case '!=': {
                this.modeConsume = false
                this.modeNot = true
                break
            }
        }
    }

    setName (name) {
        this.modeValue = true
        this.matchName = name
    }
}

class TextNode extends BaseNode {
    init (text) {
        this.text = text
    }

    rule (sr) {
        const text = this.text
        for (let i = 0, lg = text.length; i < lg; i++) {
            if (sr.read() !== text[i]) {
                return false
            }
        }
        return true
    }
}

class RuleNode extends BaseNode {
    init (key, rule, { before, done, document, stopPropagation = true } = {}) {
        this.key = key
        this.rule = rule
        this.before = before // 进入匹配中
        this.done = done // 匹配完成
        this.document = document // 文档处理
        this.stopPropagation = stopPropagation
    }
}

class LinkNode extends BaseNode {
    init (rules, key) {
        this.rules = rules
        this.key = key
        this.isLink = true
    }

    proxyNode () {
        const rule = this.rules[this.key]
        if (!rule) {
            throw Error(`miss rule "${this.key}"`)
        }
        return rule
    }

    getOriginal () {
        return this.rules[this.key]
    }
}

class GroupNode extends BaseNode {
    init () {
        this.childOr = null
        this.tempOr = null
        this.tempAnd = null
    }

    putNode (node) {
        if (this.tempOr) { // 存在or节点
            if (this.tempAnd) {
                this.tempAnd.nextAnd = node
                node.prevAnd = this.tempAnd
                this.tempAnd = node
            } else {
                this.tempOr = this.tempOr.nextOr = {
                    firstAnd: this.tempAnd = node,
                }
            }
        } else {
            this.childOr = this.tempOr = {
                firstAnd: this.tempAnd = node,
            }
        }

        node.parent = this
    }

    putOr (isEnd) {
        this.tempAnd = null
        if (isEnd) {
            delete this.tempOr
            delete this.tempAnd
        }
    }
}

class GroupRuleNode extends GroupNode {
    init (key) {
        this.key = key
        this.stopPropagation = true
    }
}

module.exports = {
    TextNode,
    RuleNode,
    LinkNode,
    GroupNode,
    GroupRuleNode,
}
