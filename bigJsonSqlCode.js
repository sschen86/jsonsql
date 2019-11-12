
const wrapper = `
@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb{
    @aarrraas(10000000)[
        @aaaaaaaaa 1111111111111
        @bbbbbbbbbb 2222222222222
        @cccccccccc 2222222222222
        @dddddddddd 2222222222222
        @eeeeeeeeeeeee 2222222222222
    ]
    
}
######PLACEHOLDER######
`

const last = `
@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb{
    @aarrraas(10000000)[
        @aaaaaaaaa 1111111111111
        @bbbbbbbbbb 2222222222222
        @cccccccccc 2222222222222
        @dddddddddd 2222222222222
        1@eeeeeeeeeeeee 2222222222222
    ]
}
`

let newCode = wrapper
const maxNum = 1
for (let i = 0; i < maxNum; i++) {
    newCode = newCode.replace('######PLACEHOLDER######', wrapper)
}
newCode = newCode.replace('######PLACEHOLDER######', last)


newCode = `
@a{
    @b{
        @c
        1
    }
}

`
console.info(newCode)
module.exports = newCode
