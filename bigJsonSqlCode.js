
const wrapper = `
@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb{
    @aarrraas(10000000)[
        @aaaaaaaaa 1111111111111
        @bbbbbbbbbb 2222222222222
        @cccccccccc 2222222222222
        @dddddddddd 2222222222222
        @eeeeeeeeeeeee 2222222222222
    ]
    ######PLACEHOLDER######
}

`

const last = `
@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb{
    @aarrraas(10000000)[
        @aaaaaaaaa 1111111111111
        @bbbbbbbbbb 2222222222222
        @cccccccccc 2222222222222
        @dddddddddd 2222222222222
        @eeeeeeeeeeeee 2222222222222
       @kddlskdsl
    ]
}
`

let newCode2 = ''
let newCode = wrapper
const maxNum = 10
for (let i = 0; i < maxNum; i++) {
    newCode = newCode.replace('######PLACEHOLDER######', wrapper)
}
newCode = newCode.replace('######PLACEHOLDER######', last)
newCode2 = ''
newCode = `
@market(where marketId = {#mid} and marketFloor = "#"){ /// String 市场数据
    #(marketFloor)

}
`


newCode = `
@goodsInfo(){ /// map 商品数据
    @goodsId 30367897++ /// Long 商品Id666
    @tbGoodsId 234123 /// Long 淘宝商品id
    @goodsVideoUrl  'https://cloud.video.taobao.com/play/u/1617209947/p/1/e/6/t/1/50057774541.mp4' /// string,null  商品主图视频url
    @title '日韩系堆堆袜日韩系堆堆袜日韩系堆堆袜日韩系堆堆袜E6-1-101 P14' /// string 商品标题
    @imgUrls(: /// string 商品图片src
        let imgs = [
            'http://imgs.571xz.net/qz-img/main/23055260/1526471021641O.jpg',
            'https://img.alicdn.com/bao/uploaded/i3/109520515/TB239QbeTvI8KJjSspjXXcgjXXa_!!109520515.jpg',
            'https://img.alicdn.com/bao/uploaded/i1/109520515/TB2RMVqaQfb_uJjSsD4XXaqiFXa_!!109520515.jpg',
            'https://img.alicdn.com/bao/uploaded/i1/109520515/TB2_FL4eNrI8KJjy0FpXXb5hVXa_!!109520515.jpg',
            'https://img.alicdn.com/bao/uploaded/i3/454807097/O1CN0122ITKhwMsx3096H_!!454807097.jpg',
            'https://img.alicdn.com/bao/uploaded/i3/109520515/TB1NvD5eRDH8KJjy1zeXXXjepXa_!!0-item_pic.jpg'
        ]
        @ imgs
    :)
    @services [1, 2]??  /// ! long 商品服务类型, 1(可退)，2（可换）
    @goodsNo 'PB032' /// string 商品货号
    @postTime '2017-02-22' /// string 发布时间
    @lowestLiPrice '80.00' /// string 电商最低零售价
    @piPrice '55.00' /// string  批发价
    @goodsNo 'PB032' /// string 商品货号
    @fabric '聚酯纤维' /// string,null 面料成分，手工发布的不能为null
    @inFabric '聚酯纤维xx' /// string,null 里料成分
    @postTime '2017-02-22' /// string 发布时间
    @lowestLiPrice '80.00' /// string 电商最低零售价
    @piPrice '55.00' /// string  批发价
    @normalAttrs(160)[ /// map 商品常规属性
        @name ['细分风格', '花型图案', '适用季节']?? /// string 商品常规属性名
        @value ['潮', '条纹', '夏季']?? /// string 商品常规属性值
    ]
    @descHtml '<div><p><img class="lazyload" style="max-width:750px; display: inline;" src="https://img.alicdn.com/imgextra/i3/166662182/TB2JEJQx0BopuFjSZPcXXc9EpXa_!!166662182.jpg" data-original="https://img.alicdn.com/imgextra/i3/166662182/TB2JEJQx0BopuFjSZPcXXc9EpXa_!!166662182.jpg" align="absmiddle"></p></div><img class="lazyload" src="https://img.alicdn.com/bao/uploaded/i3/109520515/TB1NvD5eRDH8KJjy1zeXXXjepXa_!!0-item_pic.jpg">' /// string 商品详情html
    @onSale [false,true]?? /// boolean 是否下架 true下架
    @onlineSale [true,false]?? /// boolean 是否可以线上购买 true可以
    @hasOriginalPic true /// boolean 是否存在原图
    @colorsMeta(0)[ /// - [string] 商品颜色属性列表JSON字符串
        @text /// - [string] 商品颜色
        @imgSrc /// - [string,null] 商品图片
    ]
    @sizesMeta(0)[ /// - [string] 商品尺码属性列表JSON字符串
        
    ]
    @skusMeta(0)[ /// + map,string 商品sku数据
        @text /// + string 商品颜色
        @imgSrc /// + [string,null] 商品图片
        @sizes(0)[ /// + map,string 颜色下尺码数据
            @text /// + string 尺码文本
            @num /// + string 尺码数量
            @price /// + string 尺码价格
        ]
    ]
    @dldjksjd(:
        var k = []
        for(var i = 0; i< 100; i++){
            k.push(i)
        }
        
        
        @ k
    
    :)
}

const a = 12
const b = 12

@shopInfo(){ /// map 店铺信息
    @marketName '四季星座666' /// string 市场2xxx
    @marketId '123' /// string 市场id
    @floor '1F222' /// string 楼层
    @shopId 1234  /// Long 店铺ID
    @shopNo '21245' /// string 档口号
    @starNum  457541 /// Long 店铺等级
    @mobile '15478745874' /// string 手机号
    @imQq '547874587' /// string QQ号
    @imWw '你好好' /// string 旺旺号
    @domain 'a247' /// string 档口二级域名
    @mainBus '男装' /// string 主营类目中文名
    @openTime '2014-12-12' /// string 开店时间
    @shopLicenses(0)[ /// map 店铺认证
        @licenseType [1,2,3]?? /// ? init 不确定 
    ]
    @tbAutoState [0,1,2]?? /// init 淘宝授权状态，0（未授权），1（同步授权），2（授权过期）
    @tbUrl '//xx.taobao.com' /// string,null  淘宝链接
}

@json(){
    @success true
    @market(where marketId = {#mid} and marketFloor = "#"){ /// String 市场数据
        @webSite#website /// String 市场所在站点标识
        @marketName /// String 市场名称
        @floors#market(where marketId = {#mid} and marketFloor != "#")[ /// map  楼层数据
            #(marketFloor)
            @title#marketFloor  /// string 楼层标题
            @stores#shop(where marketId = {#mid} and marketFloor = "{$marketFloor}")[ /// map 楼层中的店铺列表
                #(goodsServices)
                @storeId#shopId   /// [Long]    店铺ID
                @num#shopNo   /// [String]    档口号
                @isNew  [0,1]?? /// [Integer]    新品标识，1为新品
                @cate ['如旗舰店', '发现好货']??  ///  [String]    类目标识，如旗舰店、发现好货
                @tags $goodsServices.split(',')  /// [List_Integer]    退换服务，1退，2换
            ]
        ]
        @marketTags#market(where marketFloor = "#")[  /// map 其它市场列表
            @mid#marketId        /// [Long]    市场ID
            @name#marketName   /// [String]    市场名称
        ]
    }
}
`
console.info(newCode)
module.exports = newCode
