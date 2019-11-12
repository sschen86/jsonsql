const jsonsql = require('./index')


/*
const result = jsonsql.compile(`
@data{ /// + string,null 描述
    @code 0 /// int 状态码
    @list(2)[
        @name '张三' /// string 姓名
        @age [222212,33223332]?? /// string 年龄
    ]
}
`)
*/

const result = jsonsql.compile(`
    @abc 123 /// + string 测试字段111
    @bbb 123 /// + string,null 测试222
`)
// @2age 1 /// + string,null 年龄
// @age2 2 /// - string,nll 年龄2
// @age3 3

console.info(result)


window.onfocus = function () {
    // window.location.reload()
}
