
let indent = 0
const matcherCreated = !true
const runtimeCreated = !true
const scaning = !true
const resolve = !true
const reject = !true

module.exports = {
    matcherCreated (matcher) {
        if (matcherCreated) {
            console.warn(`${Array(indent).join('  ')}${matcher.PID}.${matcher.constructor.name}  matcherCreated`, [ matcher ])
        }
    },
    runtimeCreated (thisRuntime) {
        if (runtimeCreated) {
            console.warn(`${Array(indent).join('  ')}${thisRuntime.matcher.PID}. ${thisRuntime.matcher.constructor.name} runtimeCreated`, [ thisRuntime ])
        }
    },
    scaning ({ sr }, matcher) {
        ++indent
        if (scaning) {
            console.warn(`${Array(indent).join('  ')}${matcher.PID}.${matcher.constructor.name}${matcher._id ? `.${matcher._id}` : ''} scaning 【${sr.chIndex}: ${sr.chNow === sr.EOL ? '\\n' : sr.chNow}】`, [ matcher ])
        }
    },
    resolve (thisRuntime) {
        if (resolve) {
            const { matcher, sr } = thisRuntime
            console.warn(`${Array(indent).join('  ')}${matcher.PID}.${matcher.constructor.name}${matcher._id ? `.${matcher._id}` : ''} resolve 【${sr.text(thisRuntime.bIndex, thisRuntime.eIndex)}】`, [ matcher ])
        }
        --indent
    },
    reject (thisRuntime, error) {
        if (reject) {
            const { matcher, sr } = thisRuntime
            console.error(`${Array(indent).join('  ')}${matcher.PID}.${matcher.constructor.name}${matcher._id ? `.${matcher._id}` : ''} reject 【${sr.chIndex}: ${sr.chNow === sr.EOL ? '\\n' : sr.chNow}】`, [ matcher, error ])
        }
        --indent
    },
}
