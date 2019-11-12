const logger = {
    create: !true,
    resolve: true,
    reject: true,
    matchSuccess: true,
}

let PID = 0
class Runtime {
    constructor (parent, matcher, extral) {
        this.PID = PID++
        this.parent = parent
        this.matcher = matcher
        this.matchs = 0 // 成功匹配次数

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

    appendChild (childRuntime) {
        if (this.lastChild) {
            this.lastChild.nextSibling = childRuntime
            childRuntime.previousSibling = this.lastChild
            this.lastChild = childRuntime
        } else {
            this.firstChild = this.lastChild = childRuntime
        }
    }

    // 匹配器完成扫描
    resolve (bIndex, eIndex) {
        if (eIndex != null) {
            this.bIndex = bIndex
            this.eIndex = eIndex
        } else if (this.firstChild) {
            this.bIndex = this.firstChild.bIndex
            this.eIndex = this.lastChild.eIndex
        } else {
            // 0次匹配的节点
            this.bIndex = this.sr.chIndex
            this.eIndex = this.sr.chIndex
        }
        logger.resolve && console.warn(`${this.matcher.constructor.name} Runtime resolve`, this.sr.text(this.bIndex, this.eIndex))

        // 触发父级子项扫描成功
        this.parent.matcher.matchSuccess(this)
    }

    reject (error) {
        if (error) {
            error.stack.push(this)
        } else {
            error = { stack: [ this ], message: '匹配错误222', bIndex: this.sr.chIndex }
        }

        this.parent.matcher.matchFailure(this, error)
    }
}

module.exports = Runtime