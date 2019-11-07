

### 节点类型

+ 容器节点
+ 值节点

### 容器节点类型

+ Map容器
+ List容器

### 容器节点属性

+ 键列表 :fields


### 值节点属性

+ 字段名（别名）
+ 数据表字段名
+ 参数条件（sql查询条件，数组长度）
+ 子节点


### sql查询条件


匹配模式：
// ABA
(A?)((BA)?BA)?A

.prevMatcher
.nextMatcher
.parentMatcher


GroupMatcher
RuleMatcher
LinkMatcher


((A+ B+ C?) | (A* A+ A?))

@Group{
    @Group{
        @Pattern
        @Pattern
        @Pattern
    }
    @Group{
        @Pattern
        @Pattern
        @Pattern
    }
}


new Matcher({ source, stopPropagation, before, done })



@group{
    @m = 1
    @n = 1
    @orFirstChild<Group>{
        @andFirstChild<Pattern>{
            @nextSibling<Pattern>{
                @nextSibling<Pattern>{
                    @previousSibling<Pattern>
                }
                @previousSibling<Pattern>
            }
        }
        @nextSibling<Group>{
            @andFirstChild<Pattern>{
                @nextSibling<Pattern>{
                     @nextSibling<Pattern>{
                    
                    }
                }
            }
        }
    }
}

@Group{
    m = 1
    n = 1
    orFirstChild
    orNowChild
}

@Pattern{
    m = 1
    n = 1
}





GroupMatcher{
    groups: [
        {}
    ]
}











