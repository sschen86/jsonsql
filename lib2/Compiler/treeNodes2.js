class Node {
    constructor (runtime) {
        this.runtime = runtime
        this.parentNode = runtime.curNode

        if (!runtime.rootNode) {
            runtime.rootNode = this
        }

        console.info('newNode', this.constructor.name)

        runtime.curNode = this
    }

    document () {
        return ''
    }

    code () {
        throw Error('class Node of code must be override')
    }
}

class FieldsNode extends Node {
    constructor () {
        super(...arguments)
        this.fields = []
    }

    fieldsCode () {
        return this.fields.map(item => item.code()).join('\n')
    }

    fieldsDocument () {
        return this.fields.map(item => item.document()).join('\n')
    }

    getKeysCode () {
        const keys = []

        this.fields.forEach(item => {
            if (!item.fieldKeyValue && !item.childNode) {
                if (item.dbFieldKey) {
                    keys.push(`${item.dbFieldKey} AS ${item.fieldKey}`)
                } else {
                    keys.push(item.fieldKey)
                }
            }
        })

        if (this.dbQueryKeys) {
            keys.push(this.dbQueryKeys)
        }

        return keys.join(', ')
    }
}

class JsExpressionNode extends Node {
    code () {
        return this.jsExpression
    }
}

class NormalQueryFieldNode extends Node {
    code () {
        const key = this.queryFieldKey
        const defaultValue = this.queryDefaultValue || null
        return `let ${key} = $import("${key}", ${defaultValue});`
    }

    document () {
        const key = this.queryFieldKey
        const doc = this.docLine ? `$doc(${parseDocLine(this.docLine)});` : '$doc(null);'
        const childNode = this.childNode
        let childGetter = ''

        if (childNode && (childNode.constructor === QueryListNode || childNode.constructor === QueryMapNode)) {
            childGetter = childNode.document()
        }
        return `$queryField("${key}", function(){
            ${doc}
            ${childGetter}
        });`
    }
}

class QueryMapNode extends FieldsNode {
    code () {
        return `$queryMap(function(){
            ${this.fieldsCode()}
        });`
    }

    document () {
        return `$queryMap(function(){
            ${this.fieldsDocument()}
        });`
    }
}

class QueryListNode extends FieldsNode {
    code () {
        const childNode = this.childNode
        let getterBody
        if (childNode) {
            getterBody = childNode.code()
        } else {
            getterBody = `$queryMap(function(){
                ${this.fieldsCode()}
            });`
        }
        return `$queryList(function(){
            ${getterBody}
        });`
    }

    document () {
        const childNode = this.childNode
        let getterBody
        if (childNode) {
            getterBody = childNode.docExplain()
        } else {
            getterBody = `$queryMap(function(){
                ${this.fieldsDocument()}
            });`
        }
        return `$queryList(function(){
            ${getterBody}
        });`
    }
}

class NormalExportFieldNode extends Node {
    code () {
        const key = this.fieldKeyCode()
        let getterBody
        if (this.isDbQuery()) {
            const childNode = this.childNode
            const isArray = childNode.constructor === ListNode
            const keys = childNode.getKeysCode() || 'count(*) AS total'
            const tableName = this.dbTableName || this.fieldKey
            const sqlArgument = this.conditionCode()
            const nextGetterBody = childNode.code()
            getterBody = `$sql("SELECT ${keys} FROM ${tableName} ${sqlArgument}", function(){
                ${nextGetterBody}
            }, ${isArray});`
        } else {
            if (this.fieldKeyValue) {
                const valueText = encodeEndToken(encodeThat(this.fieldKeyValue))
                getterBody = `$value(function(){
                    return ${valueText}
                });`
            } else if (this.childNode) {
                getterBody = this.childNode.code()
            } else {
                getterBody = `$value(function(){
                    return this.${key}
                });`
            }
        }
        const mtdName = this.parentNode === this.runtime.rootNode ? 'await $export' : '$field'
        return `${mtdName}("${key}", function(){
            ${getterBody}
        });`
    }

    fieldKeyCode () { // 键名格式化
        return this.fieldKey.replace(/[^.]+\./, '')
    }

    isDbQuery () { // 是否是数据库查询字段
        return !!this.sqlCondition
    }

    conditionCode () {
        const condition = this.sqlCondition
        if (condition === 'null') {
            return ''
        }
        return `${
            condition
                .replace(/("(?:[^"]|\\")*")|('(?:[^']|\\')*')|(\|\|)|(&&)|(\\)/g, function (source, dQuote, sQuote, or, and, esChar) {
                    if (dQuote || sQuote || esChar) {
                        return source.replace(/("|'|\\)/g, '\\$1')
                    }
                    if (or) {
                        return ' OR '
                    }
                    if (and) {
                        return ' AND '
                    }
                })
                .replace(/\{(#|\$)([\w.]+)\}/g, function (source, prefix, word) {
                    if (prefix === '#') {
                        return `"+ ${word} +"`
                    } else if (prefix === '$') {
                        return `"+ this.${word} +"`
                    }
                })}`
    }

    document () {
        const key = this.fieldKeyCode()
        const doc = this.docLine ? `$doc(${parseDocLine(this.docLine)});` : '$doc(null);'
        const childNode = this.childNode
        let childGetter = ''
        if (childNode && (childNode.constructor === ListNode || childNode.constructor === MapNode)) {
            childGetter = childNode.document()
        }
        return `$field("${key}", function(){
            ${doc}
            ${childGetter}
        });`
    }
}

class MapNode extends FieldsNode {
    code () {
        if (this.parentNode) {
            return `$map(function(){
                ${this.fieldsCode()}
            });`
        }
        return this.fieldsCode()
    }

    document () {
        if (this.parentNode) {
            return `$map(function(){
                ${this.fieldsDocument()}
            });`
        }
    }
}

class ListNode extends FieldsNode {
    code () {
        const { parentNode } = this

        if (parentNode.isDbQuery()) {
            return `$list(this.$rs, function(){
                $map(function(){
                    ${this.fieldsCode()}
                })
            });`
        }

        const getterBody = this.childNode ? this.childNode.code() : `$map(function(){
            ${this.fieldsCode()}
        });`

        return `$list(${parentNode.listLength || 0}, function(){
            ${getterBody}
        });`
    }

    document () {
        const getterBody = this.childNode ? this.childNode.document() : `$map(function(){
           ${this.fieldsDocument()}
        });`
        return `$list(function(){
            ${getterBody}
        });`
    }
}

class BlockNode extends FieldsNode {
    code () {
        const expressionCode = this.valueExpressionCode()
        const expressionReturn = encodeEndToken(encodeThat(this.blockValueExpressionStatement))
        return `$block(function(){
            ${expressionCode}
            return ${expressionReturn}
        });`
    }

    valueExpressionCode () {
        if (this.blockExpressionStatement) {
            return `${this.blockExpressionStatement.split(/\n/).map(function (line) {
                return encodeThat(line.replace(/^#/, 'let '))
            }).join('\n')};`
        }
        return ''
    }
}

module.exports = {
    NormalExportFieldNode,
    NormalQueryFieldNode,
    QueryMapNode,
    QueryListNode,
    MapNode,
    ListNode,
    BlockNode,
    JsExpressionNode,
}


/// 文档解析
function parseDocLine (docLine) {
    let flag // 字段编辑类型，{'+':'新增的', '-':'删除的', '?':'存在疑问的', '!':'建议修改的'}
    let types // 字段数据类型
    let description // 字段描述
    const typeMap = { n: 'null', s: 'string', l: 'long', f: 'float', b: 'boolean', a: 'array', m: 'map' }

    docLine.replace(/^\/\/\/\s+(?:([-+?!])\s+)?((\[)[\w,\s]+\]|[\w,]+)\s+(.+)/, (source, myFlag, myTypes, isMulti, myDescription) => {
        flag = myFlag
        types = (isMulti ? myTypes.slice(1, -1) : myTypes).split(/,\s*/).map(el => typeMap[el] || el)
        description = myDescription.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    })

    return types ? [ '["', types.join('", "'), '"], "', description, '", "', flag, '"' ].join('') : null
}

/// 代码转译方法集
// $key转义成this[key]
function encodeThat (code) {
    return code.replace(/(?:"(?:[^"]|\\")*"|'(?:[^']|\\')*')|(?:\$([\w.]+))/g, (source, key) => key ? `this.${key}` : source)
}

// 转义结束符['..', '??', '++']
function encodeEndToken (code) {
    // 123++
    // [1,2,3]..
    // [1,2,3]**
    return code
        .replace(/(\d+)\+\+$/, '$1 + this.$total')
        .replace(/^(.+?)\.\.$/, '$1[this.$index]')
        .replace(/^(.+?)\?\?$/, '$random($1)')
        .replace(/^(.+?)\*\*$/, `
            (function(arr, that){      
                let i = 0;                                      
                let key;                                        
                while(true){                                    
                    key = that["$index"+i];                     
                    if(key == null){break;}                     
                    if(arr == null){return undefined;}          
                    arr = arr[key];                             
                    i++;                                        
                }                                               
                return arr;                                     
            })($1, this)
        `)
}
