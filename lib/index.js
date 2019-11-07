
// compile => jsonsql编译输出编译对象
// interpreter => 执行js输出json数据

// const ajaxDataInfo = compile(code)
// const document = ajaxDataInfo.document()
// const ajaxData = await ajaxDataInfo.explain(context)

const Compiler = require('./Compiler')
const compiler = new Compiler({
    rules: {
        main: {
            source: ' <normalExportField> | <normalQueryField> | <jsExpressionStatement>',
        },

        // 容器节点添加字段

        // 匹配导出字段
        normalExportField: {
            source: `
                '@' <exportFieldKey> ( ':' <dbFieldKey> )? <eol> | 
                '@' <exportFiledIsString>? <exportFieldToContext>? <exportFieldKey> (
                    <eol> |
                    ( '(' <s>* ')' )? ( <mapGetter> | <listGetter> | <blockGetter> ) |
                    ' ' <exportFiledValueExpression> <eol> |
                    ':' <dbFieldKey> <eol> |
                    '(' <listLength> ')' <listGetter> |
                    ( ':' <dbTableName> )? '(' <sqlCondition>? ')' (
                        <mapGetter> | <listGetter> | <blockGetter>
                    )
                )
            `,
            before: tb => { alert(666); tb.createNormalExportField() },
            done: tb => tb.compileCreateField(),
            document: (tb, text) => tb.createDocument(text),
        },

        // 匹配查询字段，一般是请求的参数
        normalQueryField: {
            source: ` 
                '#' <queryFieldKey> ( ( ' ' <queryFieldDefaultValue> )? <eol> | <queryMapGetter> | <queryListGetter> ) 
            `,
            before: tb => tb.createNormalQueryField(),
            done: tb => tb.completeCreateField(),
            document: (tb, text) => tb.createDocument(text),
        },

        // 创建子节点
        queryMapGetter: {
            source: `
                '{' <eol> <normalQueryField>* '}' <eol>
            `,
            before: tb => tb.createQueryMap(),
            done: tb => tb.compileCreateChild(),
        },
        queryListGetter: {
            source: `
                '[' <eol> <normalQueryField>* ']' <eol>
              `,
            before: tb => tb.createQueryList(),
            done: tb => tb.compileCreateChild(),
        },
        mapGetter: {
            source: ` 
                '{' <eol> <dbQuerys>? <normalExportField>* '}' <eol> 
            `,
            before: tb => tb.createMap(),
            done: tb => tb.compileCreateChild(),
        },
        listGetter: {
            source: `
                '[' <eol> <dbQuerys>? <normalExportField>* ']' <eol>
            `,
            before: (tb) => tb.createList(),
            done: tb => tb.compileCreateChild(),
        },
        blockGetter: {
            source: `
                '(:' <eol> <dbQuerys>? <blockExpressionStatement>* <valueReturn> ':)' <eol> 
             `,
            stopPropagation: true,
            before: tb => tb.createBlock(),
            done: tb => tb.compileCreateChild(),
        },

        // 设置节点属性
        queryFieldKey: {
            source: ' <w>+ ',
            done: (tb, text) => tb.setQueryFieldKey(text),
        },
        queryFieldDefaultValue: {
            source: ' <S>+ ',
            done: (tb, text) => tb.setQueryDefaultValue(text),
        },
        exportFieldKey: {
            source: ' $(<w>+) ',
            done: (tb, text) => tb.setFieldKey(text),
        },
        exportFiledValueExpression: {
            source (sr) {
                let resIsTrue = false
                while (true) {
                    if (sr.read() === sr.EOL) {
                        sr.back()
                        break
                    }
                    resIsTrue = true
                }
                return resIsTrue
            },
            done: (tb, text) => tb.setFieldValue(text),
        },
        dbQuerys: {
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
            stopPropagation: true,
            done: (tb, text) => tb.setDbQueryKeys(text.slice(2, -2)),
        },
        exportFiledIsString: {
            source: `
                ','
            `,
            done: tb => tb.setFieldIsString(),
        },
        exportFieldToContext: {
            source: `
                '#'
            `,
            done: tb => tb.setFieldToContext(),
        },
        sqlCondition: {
            source (sr) {
                let rstIsTrue = false
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
                    rstIsTrue = true // 任意长度，表示成功
                }

                return rstIsTrue
            },
            done: (tb, text) => tb.setSqlCondition(text),
        },
        dbFieldKey: {
            source: `
                <w> (<w> | '.')*
            `,
            done: (tb, text) => tb.setDbFieldKey(text),
        },
        dbTableName: {
            source: `
                <w>+ 
            `,
            done: (tb, text) => tb.setDbTableName(text),
        },
        listLength: {
            source: `
                <d>+
            `,
            done: (tb, text) => tb.setListLength(text),
        },
        blockExpressionStatement: {
            source: function (sr) {
                const text = []
                while (true) {
                    const cr = sr.read()
                    if (cr === sr.EOL) {
                        break
                    }
                    text.push(cr)
                }
                const lineText = text.join('')
                if (/^@|^:\)$/.test(lineText)) {
                    return false
                }
                return true
            },
            done: (tb, text) => tb.setBlockExpressionStatement(text),
        },
        valueReturn: {
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
            done: (tb, text) => tb.setBlockValueExpressionStatement(text.slice(2, -1)),
        },
        jsExpressionStatement: {
            source: ' <.>+ <eol> ',
            done: (tb, text) => tb.setJsExpressionStatement(text.slice(0, -1)),
        },
    },
})

module.exports = {
    compile: code => compiler.run(code),
}
