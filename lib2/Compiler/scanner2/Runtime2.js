const logger = {
    create: true,
    resolve: true,
    reject: true,
}

const STATE = {
    created: 0,
    matchSuccess: 1, // 扫描成功
    matchFailure: 2, // 扫描失败
    resultSuccess: 3, // 结果成功
    resultFailure: 4, // 结果失败
}

let PID = 0
class Runtime {
    constructor (parent, matcher, extral) {
        this.PID = PID++
        this.parent = parent
        this.matcher = matcher
        this.matchs = 0 // 成功匹配次数
        // this.state = STATE.created

        if (parent) {
            this.sr = parent.sr
        }

        if (extral) {
            Object.assign(this, extral)
        }

        logger.create && console.warn(`${matcher.constructor.name} Runtime created`, this)
    }

    createChild (matcher, extral) {
        return new Runtime(this, matcher, extral)
    }

    appendTo (parentRuntime) {
        if (parentRuntime.isGroup) { // 分组类型的matcer因为有多个子节点，所以在最后一个子节点就绪的时候进行正式插入
            if (parentRuntime.tempLastChild) {
                parentRuntime.tempLastChild.nextSibling = this
                this.previousSibling = parentRuntime.tempLastChild
                parentRuntime.tempLastChild = this
            } else {
                parentRuntime.tempFirstChild = parentRuntime.tempLastChild = this
            }
        } else {
            if (parentRuntime.lastChild) {
                parentRuntime.lastChild.nextSibling = this
                this.previousSibling = parentRuntime.lastChild
                parentRuntime.lastChild = this
            } else {
                parentRuntime.firstChild = parentRuntime.lastChild = this
                parentRuntime.bIndex = this.bIndex
            }
            parentRuntime.eIndex = this.eIndex
        }
    }

    nextTemp () {

    }

    matchSuccess (bIndex, eIndex) {
        this.matchs++
        if (this.bIndex == null) {
            this.bIndex = bIndex
        }
        if (eIndex != null) {
            this.eIndex = eIndex
        }
        this.matcher.matchSuccess(this)
    }

    matchFailure (error) {
        this.matcher.matchFailure(this, error)
    }

    resolve () {
        logger.resolve && console.warn(`${this.matcher.constructor.name}.resolve ${this.matchText()}`, this)
        this.appendTo(this.parent)
        this.matcher.resolve(this)
    }

    reject (error) {
        logger.reject && console.warn(`${this.matcher.constructor.name}.reject`, this)
        if (error) {
            error.stack.push(this)
        } else {
            error = { stack: [ this ], message: '匹配错误', bIndex: this.sr.chIndex }
        }
        this.matcher.reject(this, error)
    }

    // 子级就绪
    resolveChild () {
        this.matcher.resolveChild(this)
    }

    childResolve () {
        this.matcher.childResolve(this)
    }


    matchText () {
        return this.sr.text(this.bIndex, this.eIndex)
    }
}

module.exports = Runtime
