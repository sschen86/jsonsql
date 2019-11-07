
const {
    TextNode,
    RuleNode,
    LinkNode,
    GroupNode,
    GroupRuleNode,
} = require('./Nodes')

const scanner = require('./scanner')

class Compiler {
    constructor (option) {
        // const { rules } = option

        this._rules = {}
        this._newGroupRuleNode = newGroupRuleNodeCreator(this._rules)
        this._initSystemRules()
        this._initCustomRules(option.rules)
    }

    // 执行编译
    run (code, key = 'main') {
        const sr = scanner(code)
        const rules = this._rules

        try {
            while (sr.notEOF()) {
                sr.use(rules[key])
            }
            return sr.tree()
        } catch (err) {
            return sr.error(err)
        }
    }

    // 初始化系统规则
    _initSystemRules () {
        const thisRules = this._rules
        ;[
            [ 'w', sr => /\w/.test(sr.read()) ],
            [ 'W', sr => /\W/.test(sr.read()) ],
            [ 'd', sr => /\d/.test(sr.read()) ],
            [ 'D', sr => /\D/.test(sr.read()) ],
            [ 's', sr => /\s/.test(sr.read()) ],
            [ 'S', sr => /\S/.test(sr.read()) ],
            [ 'eol', sr => sr.read() === '\n' ],
            [ 'mol', sr => sr.read() !== '\n' ],
            [ '.', sr => sr.read() !== '\n' ],
        ].forEach(([ key, rule ]) => {
            thisRules[key] = new RuleNode(key, rule)
        })
    }

    // 初始化自定义规则
    _initCustomRules (rules) {
        const thisRules = this._rules
        for (const key in rules) {
            let option = rules[key]
            let rule


            if (typeof option === 'object') {
                rule = option.source
            } else if (typeof option === 'string') {
                rule = option
                option = {}
            }

            if (typeof rule === 'function') {
                thisRules[key] = new RuleNode(key, rule, option)
            } else if (typeof rule === 'string') {
                thisRules[key] = this._newGroupRuleNode(key, rule, option)
            }
        }
    }
}

module.exports = Compiler


function newGroupRuleNodeCreator (rules) {
    let curNode
    const groupStack = []
    const ruleReg = RegExp([
        /*
        /'((?:[^']|\\\\|\\\')+)'/,
        /<(\w+)>/,
        /(?:(\$|\w+)?(\()(==|!=|!)?)/,
        /(\))/,
        /(?:([?*+]|\{\d+\}|\{\d+,(?:\d+)?\}|\{,\d+\})(\?)?)/,
        /(|)/,
        */
        '\'((?:[^\']|\\\\\\\\|\\\\\\\')+)\'',
        '<(\\w+)>',
        '(?:(\\$|\\w+)?(\\()(==|!=|!)?)',
        '(\\))',
        '(?:([?*+]|\\{\\d+\\}|\\{\\d+,(?:\\d+)?\\}|\\{,\\d+\\})(\\?)?)',
        '(\\|)',
    ].join('|'), 'g')

    const ruleParse = (
        source,
        textMatch,
        linkMatch,
        matchGroupName, matchGroupOpen, matchGroupFlagConsume,
        matchGroupClose,
        matchSuffixNum, matchLazy,
        matchOr
    ) => {
        // console.info({source})
        switch (false) {
            case !textMatch: {
                curNode = groupStack[groupStack.length - 1]
                const textNode = new TextNode(textMatch)
                curNode.putNode(textNode)
                curNode = textNode
                break
            }
            case !linkMatch: {
                curNode = groupStack[groupStack.length - 1]
                const linkNode = new LinkNode(rules, linkMatch)
                curNode.putNode(linkNode)
                curNode = linkNode
                break
            }
            case !matchGroupOpen: {
                curNode = groupStack[groupStack.length - 1]
                const groupNode = new GroupNode()
                if (matchGroupName) {
                    groupNode.setName(matchGroupName)
                }
                if (matchGroupFlagConsume) {
                    groupNode.setFlag(matchGroupFlagConsume)
                }
                curNode.putNode(groupNode)
                curNode = groupNode
                groupStack.push(curNode)
                break
            }
            case !matchGroupClose: {
                curNode = groupStack.pop()
                curNode.putOr(true)
                break
            }
            case !matchSuffixNum: {
                switch (matchSuffixNum) {
                    case '?': {
                        curNode.suffixNum(0, 1)
                        break
                    }
                    case '*': {
                        curNode.suffixNum(0, Infinity)
                        break
                    }
                    case '+': {
                        curNode.suffixNum(1, Infinity)
                        break
                    }
                    default: {
                        matchSuffixNum = matchSuffixNum.slice(1, -1).split(',')
                        if (matchSuffixNum.length === 1) {
                            curNode.suffixNum(+matchSuffixNum[0], +matchSuffixNum[0])
                        } else {
                            curNode.suffixNum(+matchSuffixNum[0] || 0, +matchSuffixNum[1] || Infinity)
                        }
                    }
                }
                if (matchLazy) {
                    curNode.setFlag(matchLazy)
                }
                break
            }
            case !matchOr: {
                curNode = groupStack[groupStack.length - 1]
                curNode.putOr()
                break
            }
        }
    }

    return function (key, ruleString) {
        curNode = null
        curNode = new GroupRuleNode(key)
        groupStack.push(curNode)
        ruleString.replace(/\/\/\/|\/\*[\w\W]*\*\//g, '').replace(ruleReg, ruleParse)
        curNode = groupStack.pop()
        curNode.putOr(true)
        // console.info({curNode})
        return curNode
    }
}
