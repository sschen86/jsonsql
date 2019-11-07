
const { RuleMatcher, HookMatcher } = require('./Matchers')
const scanner = require('./scanner')

class Compiler {
    constructor ({ matchers }) {
        this._matchers = {}
        this._initSystemMatchers()
        this._initCustomMatchers(matchers)
    }


    _initSystemMatchers () {
        const matchers = this._matchers
        ;[
            [ 'w', sr => /\w/.test(sr.read()) ],
            [ 'W', sr => /\W/.test(sr.read()) ],
            [ 'd', sr => /\d/.test(sr.read()) ],
            [ 'D', sr => /\D/.test(sr.read()) ],
            [ 's', sr => /\s/.test(sr.read()) ],
            [ 'S', sr => /\S/.test(sr.read()) ],
            [ 'eol', sr => sr.read() === sr.EOL ],
            [ '.', sr => sr.read() !== sr.EOL ],
        ].forEach(([ id, pattern ]) => {
            matchers[id] = new RuleMatcher(id, pattern)
        })
    }

    _initCustomMatchers (matcherOptions) {
        const matchers = this._matchers
        for (const id in matcherOptions) {
            matchers[id] = new HookMatcher(id, matcherOptions[id], this)
        }
    }


    run (code, id = 'main') {
        const sr = scanner(code)
        const mainMatcher = this._matchers[id]
        let maxNum = 0
        try {
            while (sr.notEOF() && maxNum++ < 1) {
                sr.use(mainMatcher)
            }
            return sr.tree()
        } catch (err) {
            return sr.error(err)
        }
    }

    compile (code) {
        console.info(`input compile code is 【${code}】`, this)
    }
}


module.exports = Compiler
