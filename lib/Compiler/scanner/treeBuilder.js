const {
    NormalExportFieldNode,
    NormalQueryFieldNode,
    QueryMapNode,
    QueryListNode,
    MapNode,
    ListNode,
    BlockNode,
    JsExpressionNode,
} = require('./treeNodes')

module.exports = function treeBuilder () {
    return new Builder(...arguments)
}

class Builder {
    constructor (matcher) {
        new MapNode(this)
    }

    /// 节点结构控制

    // 容器下添加字段 @kk
    completeCreateField () {
        this.curNode.parentNode.fields.push(this.curNode)
        this.curNode = this.curNode.parentNode
    }

    // 完成添加子节点
    completeCreateChild () {
        this.curNode.parentNode.childNode = this.curNode
        this.curNode = this.curNode.parentNode
    }

    /// 节点对象创建快捷入口

    createNormalExportField () {
        console.info('createNormalExportField')
        new NormalExportFieldNode(this)
    }

    createNormalQueryField () {
        new NormalQueryFieldNode(this)
    }

    createQueryMap () {
        new QueryMapNode(this)
    }

    createQueryList () {
        new QueryListNode(this)
    }


    createMap () {
        new MapNode(this)
    }

    createList () {
        new ListNode(this)
    }

    createBlock () {
        new BlockNode(this)
    }

    /// 节点属性设置
    setFieldKey (text) {
        this.curNode.fieldKey = text
    }

    setFieldValue (text) {
        this.curNode.fieldKeyValue = text
    }

    // 设置数据库查询条件
    setSqlCondition (text) {
        this.curNode.sqlCondition = text
    }

    // 设置数据库查询字段映射
    setDbQueryKeys (text) {
        if (text) {
            this.curNode.dbQueryKeys = text
        }
    }

    // 设置导出字段映射
    setDbFieldKey (text) {
        this.curNode.dbFieldKey = text
    }

    // 设置查询数据库的表名
    setDbTableName (text) {
        this.curNode.dbTableName = text
    }

    setBlockExpressionStatement (text) {
        this.curNode.blockExpressionStatement = text
    }

    setBlockValueExpressionStatement (text) {
        this.curNode.blockValueExpressionStatement = text
    }

    setListLength (text) {
        this.curNode.listLength = +text || 0
    }

    setFieldIsString () {
        this.curNode.fieldIsString = true
    }

    setFieldToContext () {
        this.curNode.fieldToContext = true
    }

    setDocLine (text) {
        if (text) {
            this.curNode.docLine = text
        }
    }

    setQueryFieldKey (text) {
        this.curNode.queryFieldKey = text
    }

    setQueryDefaultValue (text) {
        this.curNode.queryDefaultValue = text
    }

    setJsExpressionStatement (text) {
        new JsExpressionNode()
        this.addField()
        this.curNode.jsExpression = text
        this.complete()
    }

    getValue () {
        return this.rootNode
    }
}
