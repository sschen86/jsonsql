/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./demo.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./demo.js":
/*!*****************!*\
  !*** ./demo.js ***!
  \*****************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const jsonsql = __webpack_require__(/*! ./index */ \"./index.js\")\n\n/*\nconst result = jsonsql.compile(`\n@data{ /// + string,null 描述\n    @code 0 /// int 状态码\n    @list(2)[\n        @name '张三' /// string 姓名\n        @age [222212,33223332]?? /// string 年龄\n    ]\n}\n`)\n*/\n\nconst result = jsonsql.compile(`\n@age 1 /// + string,null 年龄\n@age2 2 /// - string,nll 年龄2\n@age3 3\n`)\n\n\nconsole.info(result)\n\n\nwindow.onfocus = function () {\n    window.location.reload()\n}\n\n\n//# sourceURL=webpack:///./demo.js?");

/***/ }),

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(/*! ./lib */ \"./lib/index.js\")\n\n\n//# sourceURL=webpack:///./index.js?");

/***/ }),

/***/ "./lib/Compiler/Nodes.js":
/*!*******************************!*\
  !*** ./lib/Compiler/Nodes.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("class BaseNode {\n    constructor () {\n        this.m = 1\n        this.n = 1\n        // this.modeLazy = false // 惰性模式\n        // this.this.modeConsume = true // 消耗模式\n        // this.modeNot = false // 非模式\n        this.modeValue = false // 捕获取值\n        this.init(...arguments)\n    }\n\n    suffixNum (m, n) { // 匹配次数\n        // ? = {0,1}\n        // * = {0,Infinity}\n        // + = {1,Infinity}\n        // {m,n} = {m,n}\n        this.m = m\n        this.n = n\n    }\n\n    setFlag (flag) {\n        switch (flag) {\n            case '?': {\n                this.modeLazy = true\n                break\n            }\n            case '!': {\n                this.modeNot = true\n                break\n            }\n            case '==': {\n                this.modeConsume = false\n                break\n            }\n            case '!=': {\n                this.modeConsume = false\n                this.modeNot = true\n                break\n            }\n        }\n    }\n\n    setName (name) {\n        this.modeValue = true\n        this.matchName = name\n    }\n}\n\nclass TextNode extends BaseNode {\n    init (text) {\n        this.text = text\n    }\n\n    rule (sr) {\n        const text = this.text\n        for (let i = 0, lg = text.length; i < lg; i++) {\n            if (sr.read() !== text[i]) {\n                return false\n            }\n        }\n        return true\n    }\n}\n\nclass RuleNode extends BaseNode {\n    init (key, rule, { before, done, document, stopPropagation = true } = {}) {\n        this.key = key\n        this.rule = rule\n        this.before = before // 进入匹配中\n        this.done = done // 匹配完成\n        this.document = document // 文档处理\n        this.stopPropagation = stopPropagation\n    }\n}\n\nclass LinkNode extends BaseNode {\n    init (rules, key) {\n        this.rules = rules\n        this.key = key\n        this.isLink = true\n    }\n\n    proxyNode () {\n        const rule = this.rules[this.key]\n        if (!rule) {\n            throw Error(`miss rule \"${this.key}\"`)\n        }\n        return rule\n    }\n\n    getOriginal () {\n        return this.rules[this.key]\n    }\n}\n\nclass GroupNode extends BaseNode {\n    init () {\n        this.childOr = null\n        this.tempOr = null\n        this.tempAnd = null\n    }\n\n    putNode (node) {\n        if (this.tempOr) { // 存在or节点\n            if (this.tempAnd) {\n                this.tempAnd.nextAnd = node\n                node.prevAnd = this.tempAnd\n                this.tempAnd = node\n            } else {\n                this.tempOr = this.tempOr.nextOr = {\n                    firstAnd: this.tempAnd = node,\n                }\n            }\n        } else {\n            this.childOr = this.tempOr = {\n                firstAnd: this.tempAnd = node,\n            }\n        }\n\n        node.parent = this\n    }\n\n    putOr (isEnd) {\n        this.tempAnd = null\n        if (isEnd) {\n            delete this.tempOr\n            delete this.tempAnd\n        }\n    }\n}\n\nclass GroupRuleNode extends GroupNode {\n    init (key) {\n        this.key = key\n        this.stopPropagation = true\n    }\n}\n\nmodule.exports = {\n    TextNode,\n    RuleNode,\n    LinkNode,\n    GroupNode,\n    GroupRuleNode,\n}\n\n\n//# sourceURL=webpack:///./lib/Compiler/Nodes.js?");

/***/ }),

/***/ "./lib/Compiler/index.js":
/*!*******************************!*\
  !*** ./lib/Compiler/index.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("\nconst {\n    TextNode,\n    RuleNode,\n    LinkNode,\n    GroupNode,\n    GroupRuleNode,\n} = __webpack_require__(/*! ./Nodes */ \"./lib/Compiler/Nodes.js\")\n\nconst scanner = __webpack_require__(/*! ./scanner */ \"./lib/Compiler/scanner/index.js\")\n\nclass Compiler {\n    constructor (option) {\n        // const { rules } = option\n\n        this._rules = {}\n        this._newGroupRuleNode = newGroupRuleNodeCreator(this._rules)\n        this._initSystemRules()\n        this._initCustomRules(option.rules)\n    }\n\n    // 执行编译\n    run (code, key = 'main') {\n        const sr = scanner(code)\n        const rules = this._rules\n\n        try {\n            while (sr.notEOF()) {\n                sr.use(rules[key])\n            }\n            return sr.tree()\n        } catch (err) {\n            return sr.error(err)\n        }\n    }\n\n    // 初始化系统规则\n    _initSystemRules () {\n        const thisRules = this._rules\n        ;[\n            [ 'w', sr => /\\w/.test(sr.read()) ],\n            [ 'W', sr => /\\W/.test(sr.read()) ],\n            [ 'd', sr => /\\d/.test(sr.read()) ],\n            [ 'D', sr => /\\D/.test(sr.read()) ],\n            [ 's', sr => /\\s/.test(sr.read()) ],\n            [ 'S', sr => /\\S/.test(sr.read()) ],\n            [ 'eol', sr => sr.read() === '\\n' ],\n            [ 'mol', sr => sr.read() !== '\\n' ],\n            [ '.', sr => sr.read() !== '\\n' ],\n        ].forEach(([ key, rule ]) => {\n            thisRules[key] = new RuleNode(key, rule)\n        })\n    }\n\n    // 初始化自定义规则\n    _initCustomRules (rules) {\n        const thisRules = this._rules\n        for (const key in rules) {\n            let option = rules[key]\n            let rule\n\n\n            if (typeof option === 'object') {\n                rule = option.source\n            } else if (typeof option === 'string') {\n                rule = option\n                option = {}\n            }\n\n            if (typeof rule === 'function') {\n                thisRules[key] = new RuleNode(key, rule, option)\n            } else if (typeof rule === 'string') {\n                thisRules[key] = this._newGroupRuleNode(key, rule, option)\n            }\n        }\n    }\n}\n\nmodule.exports = Compiler\n\n\nfunction newGroupRuleNodeCreator (rules) {\n    let curNode\n    const groupStack = []\n    const ruleReg = RegExp([\n        '\\'((?:[^\\']|\\\\\\\\\\\\\\\\|\\\\\\\\\\\\\\')+)\\'',\n        '<(\\\\w+)>',\n        '(?:(\\\\$|\\\\w+)?(\\\\()(==|!=|!)?)',\n        '(\\\\))',\n        '(?:([?*+]|\\\\{\\\\d+\\\\}|\\\\{\\\\d+,(?:\\\\d+)?\\\\}|\\\\{,\\\\d+\\\\})(\\\\?)?)',\n        '(\\\\|)',\n    ].join('|'), 'g')\n\n    const ruleParse = (\n        source,\n        textMatch,\n        linkMatch,\n        matchGroupName, matchGroupOpen, matchGroupFlagConsume,\n        matchGroupClose,\n        matchSuffixNum, matchLazy,\n        matchOr\n    ) => {\n        // console.info({source})\n        switch (false) {\n            case !textMatch: {\n                curNode = groupStack[groupStack.length - 1]\n                const textNode = new TextNode(textMatch)\n                curNode.putNode(textNode)\n                curNode = textNode\n                break\n            }\n            case !linkMatch: {\n                curNode = groupStack[groupStack.length - 1]\n                const linkNode = new LinkNode(rules, linkMatch)\n                curNode.putNode(linkNode)\n                curNode = linkNode\n                break\n            }\n            case !matchGroupOpen: {\n                curNode = groupStack[groupStack.length - 1]\n                const groupNode = new GroupNode()\n                if (matchGroupName) {\n                    groupNode.setName(matchGroupName)\n                }\n                if (matchGroupFlagConsume) {\n                    groupNode.setFlag(matchGroupFlagConsume)\n                }\n                curNode.putNode(groupNode)\n                curNode = groupNode\n                groupStack.push(curNode)\n                break\n            }\n            case !matchGroupClose: {\n                curNode = groupStack.pop()\n                curNode.putOr(true)\n                break\n            }\n            case !matchSuffixNum: {\n                switch (matchSuffixNum) {\n                    case '?': {\n                        curNode.suffixNum(0, 1)\n                        break\n                    }\n                    case '*': {\n                        curNode.suffixNum(0, Infinity)\n                        break\n                    }\n                    case '+': {\n                        curNode.suffixNum(1, Infinity)\n                        break\n                    }\n                    default: {\n                        matchSuffixNum = matchSuffixNum.slice(1, -1).split(',')\n                        if (matchSuffixNum.length === 1) {\n                            curNode.suffixNum(+matchSuffixNum[0], +matchSuffixNum[0])\n                        } else {\n                            curNode.suffixNum(+matchSuffixNum[0] || 0, +matchSuffixNum[1] || Infinity)\n                        }\n                    }\n                }\n                if (matchLazy) {\n                    curNode.setFlag(matchLazy)\n                }\n                break\n            }\n            case !matchOr: {\n                curNode = groupStack[groupStack.length - 1]\n                curNode.putOr()\n                break\n            }\n        }\n    }\n\n    return function (key, ruleString) {\n        curNode = null\n        curNode = new GroupRuleNode(key)\n        groupStack.push(curNode)\n        ruleString.replace(/\\/\\/\\/|\\/\\*[\\w\\W]*\\*\\//g, '').replace(ruleReg, ruleParse)\n        curNode = groupStack.pop()\n        curNode.putOr(true)\n        // console.info({curNode})\n        return curNode\n    }\n}\n\n\n//# sourceURL=webpack:///./lib/Compiler/index.js?");

/***/ }),

/***/ "./lib/Compiler/scanner/index.js":
/*!***************************************!*\
  !*** ./lib/Compiler/scanner/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = scanner\n\n\nfunction scanner (code) {\n    const [ BOF, EOF, EOL ] = [ {}, {}, '\\n' ]\n    let [ chNow, chIndex, chAlls, chMaps ] = [ BOF, -1, [], [] ]\n\n    // 初始化代码数据\n    ;(() => {\n        let lineNum = -1 // 原始行标，因为要对空行进行过滤\n        code.split(/\\r\\n?|\\r?\\n/).forEach(line => {\n            line = line.trim()\n            lineNum++\n\n            if (!line) {\n                return\n            }\n\n            let document\n            line = line.replace(/\\/\\/(\\/)? .+/, (matched, isDocument) => {\n                if (isDocument) {\n                    document = matched\n                }\n                return ''\n            }).trim()\n\n            if (!line) {\n                return\n            }\n\n            const bIndex = chAlls.length\n            chAlls.push(...line.split(''), '\\n')\n            const eIndex = chAlls.length\n            chMaps.push([ lineNum, bIndex, eIndex, document ])\n        })\n    })()\n\n    const scanner = {\n        notEOF: () => chIndex < chAlls.length,\n        use (ruleNode) {\n            return (new Matcher(ruleNode)).scan()\n        },\n        error (err) {\n            console.error(err)\n        },\n    }\n\n    chNow = 2\n\n    const runtime = { rootMatcher: null, curMatcher: null, curLinkId: null, MatcherPID: 1 }\n\n\n    console.info({ chNow, chIndex, chAlls, chMaps })\n\n\n    return scanner\n}\n\n\n//# sourceURL=webpack:///./lib/Compiler/scanner/index.js?");

/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("\n// compile => jsonsql编译输出编译对象\n// interpreter => 执行js输出json数据\n\n// const ajaxDataInfo = compile(code)\n// const document = ajaxDataInfo.document()\n// const ajaxData = await ajaxDataInfo.explain(context)\n\nconst Compiler = __webpack_require__(/*! ./Compiler */ \"./lib/Compiler/index.js\")\nconst compiler = new Compiler({\n    rules: {\n        main: {\n            source: ' <normalExportField> | <normalQueryField> | <jsExpressionStatement>',\n        },\n\n        // 容器节点添加字段\n\n        // 匹配导出字段\n        normalExportField: {\n            source: `\n                '@' <exportFieldKey> ( ':' <dbFieldKey> )? <eol> | \n                '@' <exportFiledIsString>? <exportFieldToContext>? <exportFieldKey> (\n                    <eol> |\n                    ( '(' <s>* ')' )? ( <mapGetter> | <listGetter> | <blockGetter> ) |\n                    ' ' <exportFiledValueExpression> <eol> |\n                    ':' <dbFieldKey> <eol> |\n                    '(' <listLength> ')' <listGetter> |\n                    ( ':' <dbTableName> )? '(' <sqlCondition>? ')' (\n                        <mapGetter> | <listGetter> | <blockGetter>\n                    )\n                )\n            `,\n            before: tb => { alert(666); tb.createNormalExportField() },\n            done: tb => tb.compileCreateField(),\n            document: (tb, text) => tb.createDocument(text),\n        },\n\n        // 匹配查询字段，一般是请求的参数\n        normalQueryField: {\n            source: ` \n                '#' <queryFieldKey> ( ( ' ' <queryFieldDefaultValue> )? <eol> | <queryMapGetter> | <queryListGetter> ) \n            `,\n            before: tb => tb.createNormalQueryField(),\n            done: tb => tb.completeCreateField(),\n            document: (tb, text) => tb.createDocument(text),\n        },\n\n        // 创建子节点\n        queryMapGetter: {\n            source: `\n                '{' <eol> <normalQueryField>* '}' <eol>\n            `,\n            before: tb => tb.createQueryMap(),\n            done: tb => tb.compileCreateChild(),\n        },\n        queryListGetter: {\n            source: `\n                '[' <eol> <normalQueryField>* ']' <eol>\n              `,\n            before: tb => tb.createQueryList(),\n            done: tb => tb.compileCreateChild(),\n        },\n        mapGetter: {\n            source: ` \n                '{' <eol> <dbQuerys>? <normalExportField>* '}' <eol> \n            `,\n            before: tb => tb.createMap(),\n            done: tb => tb.compileCreateChild(),\n        },\n        listGetter: {\n            source: `\n                '[' <eol> <dbQuerys>? <normalExportField>* ']' <eol>\n            `,\n            before: (tb) => tb.createList(),\n            done: tb => tb.compileCreateChild(),\n        },\n        blockGetter: {\n            source: `\n                '(:' <eol> <dbQuerys>? <blockExpressionStatement>* <valueReturn> ':)' <eol> \n             `,\n            stopPropagation: true,\n            before: tb => tb.createBlock(),\n            done: tb => tb.compileCreateChild(),\n        },\n\n        // 设置节点属性\n        queryFieldKey: {\n            source: ' <w>+ ',\n            done: (tb, text) => tb.setQueryFieldKey(text),\n        },\n        queryFieldDefaultValue: {\n            source: ' <S>+ ',\n            done: (tb, text) => tb.setQueryDefaultValue(text),\n        },\n        exportFieldKey: {\n            source: ' $(<w>+) ',\n            done: (tb, text) => tb.setFieldKey(text),\n        },\n        exportFiledValueExpression: {\n            source (sr) {\n                let resIsTrue = false\n                while (true) {\n                    if (sr.read() === sr.EOL) {\n                        sr.back()\n                        break\n                    }\n                    resIsTrue = true\n                }\n                return resIsTrue\n            },\n            done: (tb, text) => tb.setFieldValue(text),\n        },\n        dbQuerys: {\n            source (sr) {\n                if (sr.read() !== '#') {\n                    return false\n                }\n\n                const text = []\n                while (sr.notEOF()) {\n                    const cr = sr.read()\n                    if (cr === sr.EOL) {\n                        break\n                    }\n                    text.push(cr)\n                }\n                return /^\\(.+?\\)$/.test(text.join(''))\n            },\n            stopPropagation: true,\n            done: (tb, text) => tb.setDbQueryKeys(text.slice(2, -2)),\n        },\n        exportFiledIsString: {\n            source: `\n                ','\n            `,\n            done: tb => tb.setFieldIsString(),\n        },\n        exportFieldToContext: {\n            source: `\n                '#'\n            `,\n            done: tb => tb.setFieldToContext(),\n        },\n        sqlCondition: {\n            source (sr) {\n                let rstIsTrue = false\n                let isEscape = false // 是否遇到转义反斜杠\n                let bkLength = 0 // 括号开启的次数\n\n                while (sr.notEOF()) {\n                    const cr = sr.read()\n                    if (isEscape) {\n                        isEscape = false\n                    } else if (cr === '\\\\') {\n                        isEscape = true\n                    } else if (cr === '(') {\n                        bkLength++\n                    } else if (cr === ')') {\n                        if (bkLength > 0) {\n                            bkLength--\n                        } else { // 结束\n                            sr.back()\n                            break\n                        }\n                    }\n                    rstIsTrue = true // 任意长度，表示成功\n                }\n\n                return rstIsTrue\n            },\n            done: (tb, text) => tb.setSqlCondition(text),\n        },\n        dbFieldKey: {\n            source: `\n                <w> (<w> | '.')*\n            `,\n            done: (tb, text) => tb.setDbFieldKey(text),\n        },\n        dbTableName: {\n            source: `\n                <w>+ \n            `,\n            done: (tb, text) => tb.setDbTableName(text),\n        },\n        listLength: {\n            source: `\n                <d>+\n            `,\n            done: (tb, text) => tb.setListLength(text),\n        },\n        blockExpressionStatement: {\n            source: function (sr) {\n                const text = []\n                while (true) {\n                    const cr = sr.read()\n                    if (cr === sr.EOL) {\n                        break\n                    }\n                    text.push(cr)\n                }\n                const lineText = text.join('')\n                if (/^@|^:\\)$/.test(lineText)) {\n                    return false\n                }\n                return true\n            },\n            done: (tb, text) => tb.setBlockExpressionStatement(text),\n        },\n        valueReturn: {\n            source (sr) {\n                if (sr.read() !== '@' || sr.read() !== ' ') {\n                    return false\n                }\n                while (true) {\n                    if (sr.read() === sr.EOL) {\n                        break\n                    }\n                }\n                return true\n            },\n            done: (tb, text) => tb.setBlockValueExpressionStatement(text.slice(2, -1)),\n        },\n        jsExpressionStatement: {\n            source: ' <mol>+ <eol> ',\n            done: (tb, text) => tb.setJsExpressionStatement(text.slice(0, -1)),\n        },\n    },\n})\n\nmodule.exports = {\n    compile: code => compiler.run(code),\n}\n\n\n//# sourceURL=webpack:///./lib/index.js?");

/***/ })

/******/ });