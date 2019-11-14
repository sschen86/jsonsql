

// 解释器装载对应的代码，返回解释器执行器
function use (code) {
    return function (context) {
        return { code, context }
    }
}


module.exports = {
    use,
}
