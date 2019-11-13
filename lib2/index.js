

const Compiler = require('./Compiler')

const compiler = new Compiler({
    matchers: {
        main: {
            // source: '<w>+',
            source: ' <objectField>& | <jsExpression> ',
        },

        objectField: {
            source: `
                '@' <objectFieldKey> 
                (
                    ( ':' <dbFieldKey> )? <eol> |
                    ( <s>+ <objectFiledValueExpression> <eol> )& |
                    ( '(' <s>* ')' )? <block>& |
                    ( '(' <listLength> ')' <list> )& |
                    ( ':' <dbTableName> )? '(' <dbSqlExpression>? ')' <block>
                )
            `,
            before: tb => tb.objectFieldCreate(),
            done: tb => tb.objectFieldComplete(),
            document: (tb, text) => tb.documentCreate(text),
        },
        block: {
            source: '<map>& | <list>& | <value>&',
        },

        objectFieldKey: {
            source: ' <w>+ ',
            done: (tb, text) => tb.objectFieldSetKey(text),
        },
        objectFiledValueExpression: {
            source (sr) {
                let hasMatched = false
                while (true) {
                    if (sr.read() === sr.EOL) {
                        sr.back()
                        break
                    }
                    hasMatched = true
                }
                return hasMatched
            },
            done: (tb, text) => tb.objectFieldSetValueExpression(text),
        },

        map: {
            source: ` 
                '{' <eol> <dbFieldDefine>? <objectField>*& '}' <eol> 
            `,
            before: tb => tb.mapCreate(),
            done: tb => tb.childCompile(),
            exclusive: true,
        },
        list: {
            source: `
                '[' <eol> <dbFieldDefine>? <objectField>*& ']' <eol>
            `,
            before: (tb) => tb.listCreate(),
            done: tb => tb.childCompile(),
            exclusive: true,
        },
        listLength: {
            source: ' <d>+ ',
            done: (tb, text) => tb.listSetLength(text),
        },
        value: {
            source: `
                '(:' <eol> <dbFieldDefine>? <blockExpression>* <valueReturnExpression> ':)' <eol> 
            `,
            before: tb => tb.block(),
            done: tb => tb.childCompile(),
            exclusive: true,
        },
        blockExpression: {
            source: function (sr) {
                const text = []
                while (true) {
                    const cr = sr.read()
                    if (cr === sr.EOL) {
                        break
                    }
                    text.push(cr)
                }
                const line = text.join('')
                if (/^@|^:\)$/.test(line)) {
                    return false
                }
                return true
            },
            done: (tb, text) => tb.setBlockExpression(text),
        },
        valueReturnExpression: {
            source (sr) {
                if (sr.read() !== '@' || sr.read() !== ' ') {
                    return false
                }
                while (true) {
                    if (sr.read() === sr.EOL) {
                        break
                    }
                }
                return true
            },
            done: (tb, text) => tb.setValueReturnExpression(text.slice(2, -1)),
        },

        jsExpression: {
            source: ' <.>+ <eol> ',
            done: (tb, text) => tb.setJsExpression(text.slice(0, -1)),
        },

        dbFieldKey: {
            source: `
                <w> (<w> | '.')*
            `,
            done: (tb, text) => tb.dbSetFieldKey(text),
        },
        dbTableName: {
            source: ' <w>+ ',
            done: (tb, text) => tb.dbSetTableName(text),
        },
        dbSqlExpression: {
            source (sr) {
                let hasMatched = false
                let isEscape = false // 是否遇到转义反斜杠
                let bkLength = 0 // 括号开启的次数

                while (sr.notEOF()) {
                    const cr = sr.read()
                    if (isEscape) {
                        isEscape = false
                    } else if (cr === '\\') {
                        isEscape = true
                    } else if (cr === '(') {
                        bkLength++
                    } else if (cr === ')') {
                        if (bkLength > 0) {
                            bkLength--
                        } else { // 结束
                            sr.back()
                            break
                        }
                    }
                    hasMatched = true // 任意长度，表示成功
                }

                return hasMatched
            },
            done: (tb, text) => tb.dbSetSqlExpression(text),
        },
        dbFieldDefine: {
            source (sr) {
                if (sr.read() !== '#') {
                    return false
                }

                const text = []
                while (sr.notEOF()) {
                    const cr = sr.read()
                    if (cr === sr.EOL) {
                        break
                    }
                    text.push(cr)
                }
                return /^\(.+?\)$/.test(text.join(''))
            },
            done: (tb, text) => tb.dbSetFieldDefine(text.slice(2, -2)),
        },

    },
})

module.exports = {
    compile: code => compiler.run(code),
}
