const logger = {
    scaning: true,
    resolve: true,
    reject: true,
}

let PID = 0
class Runtime {
    constructor (parent, matcher, extral) {
        this.PID = PID++
        this.parent = parent
        this.matcher = matcher
        this.matchs = 0
        this.isSuccess = true

        if (parent) {
            this.sr = parent.sr
        }

        if (extral) {
            Object.assign(this, extral)
        }

        logger.scaning && console.warn(`${matcher.constructor.name}.scan`, this)
    }

    createChild (matcher, extral) {
        return new Runtime(this, matcher, extral)
    }


    resolve (bIndex, eIndex) {
        if (bIndex !== undefined) {
            this.bIndex = bIndex
            this.eIndex = eIndex
        }
        this.appendTo(this.parent)
        this.matcher.resolve(this)
    }

    reject (error) {
        this.matcher.reject(this, error)
    }

    appendTo (parentRuntime) {
        if (parentRuntime.lastChild) {
            parentRuntime.lastChild.nextSibling = this
            this.previousSibling = parentRuntime.lastChild
            parentRuntime.lastChild = this
        } else {
            parentRuntime.firstChild = parentRuntime.lastChild = this
            parentRuntime.bIndex = this.bIndex
        }
        parentRuntime.eIndex = this.eIndex
        logger.resolve && console.warn(`${this.matcher.constructor.name}.resolve ${this.sr.text(this.bIndex, this.eIndex)}`, this)
    }


    scanRealMatcher (isRequired) {
        this.scanRealMatcher.scan(this, isRequired)
        return this.isSuccess
    }

    scan (isRequired) {
        this.activedMatcher.scan(this, isRequired)
        return this.isSuccess
    }

    resolve222 (bIndex, eIndex) {
        if (bIndex !== undefined) {
            this.bIndex = bIndex
            this.eIndex = eIndex
        }
        this.appendTo(this.parent)
        this.activedMatcher.resolve(this)
    }


    reject2 (error) {
        this.matcher.reject(this, error)
    }

    // 以下全部废弃

    // 压入回溯点
    createBacktracking2 (range) {
        this.greedys = this.greedys || []
        this.greedys.push(range)
        this.parent.backtrackingStack = this.parent.backtrackingStack || []
        this.parent.backtrackingStack.push(this)
    }

    // 弹出回溯点
    popBacktracking2 () {
        const childRuntime = this.backtrackingStack.pop()
        const { bIndex } = childRuntime.greedys.pop() // 移除贪婪缓冲区

        childRuntime.sr.moveTo(bIndex) // 移动扫描指针
        childRuntime.setRange({ eIndex: bIndex }) // 设置新的区间
        if (this.backtrackingStack.length === 0) {
            this.backtrackingStack = null
        }
        return childRuntime
    }

    // 读取回溯点
    getBacktracking2 () {
        return this.backtrackingStack[this.backtrackingStack.length - 1]
    }

    pushGreedy2 (range) {
        this.greedys = this.greedys || []
        this.greedys.push(range)
    }

    popGreedy2 () {
        return this.greedys.pop()
    }

    // 设置匹配结果区间
    setRange2 (range) {
        'bIndex' in range && (this.bIndex = range.bIndex)
        'eIndex' in range && (this.eIndex = range.eIndex)
    }

    setLastChild2 (childRuntime) {
        childRuntime.nextSibling = null
        this.lastChild = childRuntime
    }

    resolve2 (range) {
        this.setRange(range)
        console.warn(`${this.matcher.constructor.name}.resolve matched:${this.sr.text(range.bIndex, range.eIndex)}`, this)
        this.parent.matcher.resolve(this, this.parent)
    }

    reject2 (error) {
        console.warn(`${this.matcher.constructor.name}.reject`, this)
        error.stack.push(this.parent.matcher)
        this.parent.matcher.reject(this, error)
    }
}

module.exports = Runtime
