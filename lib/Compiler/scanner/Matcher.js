class Matcher {
    constructor (pattern, parent, runtime) {
        this.pattern = pattern
        this.parent = parent
        this.runtime = runtime
    }

    match () {
        let isSuccess = true
        let { pattern } = this
        let { bIndex, chIndex, scanner } = this.runtime

        if (pattern.isLinkNode) {
            pattern = pattern.getOriginNode()
        }

        // 必选集
        for (let i = 0; i < this.m; i++) {
            const backIndex = chIndex
            if (!pattern.rule(scanner)) {
                chIndex = backIndex
                isSuccess = false
                break
            }
        }

        if (!isSuccess) {
            return this.failure()
        }

        // 贪婪集
        for (let i = this.m; i < this.n; i++) {
            const backIndex = chIndex
            if (!pattern.rule(scanner)) {
                chIndex = backIndex
                break
            }
            this.greedys = this.greedys || []
            this.greedys.push({ bIndex: backIndex, eIndex: chIndex })
        }

        this.bIndex = bIndex
        this.eIndex = chIndex
        this._modeGreedy = !!this.greedys
        this._moderule = true
        this.success()
    }

    failure (failureStacks) {
        if (this.firstMatcher && this.stopPropagation) {
            throw MatcherError(failureStacks)
        }

        // 定义Matcher
        //
    }

    success () {

    }

    // 执行下一个
    next () {

    }

    // 执行匹配
    run () {

    }
}

module.exports = Matcher
