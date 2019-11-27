(function (global, doc, NAME) {
    const srcTypes = ['eot', 'woff2', 'woff', 'ttf'], Perf = global.performance
    let fontStatu = {}, urlStatu = {}, statedFonts = [], statedUrls = [],
        timeout = 5e3, isWait = false, cbList = [],
        urlAnchor = doc.createElement('a'),
        textDiv = doc.createElement('div')
    textDiv.id = `_${NAME}_hidden`
    textDiv.style.cssText = `position:fixed;top:-500px;bottom:120%;visibility:hidden;z-index:-1;`
    function toAbsUrl(url) { return urlAnchor.href = url, urlAnchor.href }
    function addFonts(fonts) {
        /*
        @font-face {
            font-family:’Helvetica’;
            src: url(fonts/Helvetica-Regular.eot?#iefix) format(‘eot’),
                url(fonts/Helvetica-Regular.woff2) format(‘woff2’),
                url(fonts/Helvetica-Regular.woff) format(‘woff’),
                url(fonts/Helvetica-Regular.ttf) format(‘truetype’);
            font-weight: 400;
            font-style: <font-style>;
            font-stretch: <font-stretch>;
            unicode-range:<unicode-range>;
        }
        */
        let s = doc.createElement('style'), now = Date.now()
        s.id = `_${NAME}_style`
        s.innerHTML = fonts.map(font => {
            let { name, weight, style, stretch, range } = font
            if (name in fontStatu) { return console.error(`fontface [${name}] is repeated!`) }
            fontStatu[name] = false
            statedFonts.push(name)
            src = srcTypes.map((x, i) => {
                let src = font[x]
                if (!src) { return }
                let abs = toAbsUrl(src)
                if (urlStatu[abs]) { return console.error(`fontface [${name}]'s url '${src}' is repeated!`) }
                statedUrls.push(abs)
                urlStatu[abs] = { name, start: now, isload: false, end: 0 }
                return `url('${src}${i == 0 ? '?#iefix' : ''}') format('${i == 3 ? 'truetype' : x}')`
            }).filter(x => x),
                others = [weight ? 'font-weight:' + weight : '',
                style ? 'font-style:' + style : '',
                stretch ? 'font-stretch:' + stretch : '',
                range ? 'unicode-range:' + range : ''].filter(x => x)
            return `@font-face{
font-family:'${name}';
src: ${src.join(',\n')};${others.length > 0 ? '\n' : ''}${others.join(';\n')}
}`
        }).join('\n')
        doc.head.appendChild(s)
        if (textDiv.parentNode != doc.body) { doc.body.appendChild(textDiv) }
        fonts.map(font => {
            let span = textDiv.appendChild(doc.createElement('span'))
            span.style.fontFamily = font.name
            span.innerHTML = '0'
        })
        isWait = true
        setTimeout(startCheck, 50)
    }
    function startCheck() {
        let res = Perf.getEntries().filter(x => x.initiatorType == 'css').map(x => {
            return x
        }), resMap = res.reduce((a, b) => (a[b.name] = b, a), {}), now = Date.now(),
            needWait;
        statedUrls.map(x => {
            if (urlStatu[x].isload) { return }
            let s = urlStatu[x]
            if (resMap[x]) {
                s.end = now
                s.isload = fontStatu[s.name] = true
            } else {
                if (now - s.start < timeout) { needWait = true }
            }
        })
        if (needWait) { return setTimeout(startCheck, 16) }
        else { isWait = false; runCb() }
    }
    function runCb() {
        if (isWait) { return }
        let fail = [], ok = []
        statedFonts.map(x => (fontStatu[x] ? ok : fail).push(x))
        while (cbList.length > 0) {
            cbList.shift()(fail, ok)
        }
    }
    const issupport = Perf && typeof Perf.getEntries == 'function',
        _ = {
            get can() { return issupport },
            /**
             * 设置下载字体的超时时间  默认5s
             * @param {number} x 毫秒
             */
            timeout(x) { return timeout = x, _ },
            /**
             * 添加fontface并立即下载
             * @param  {...any} fonts [ {name,ttf},... ]
             */
            add(...fonts) {
                if (fonts.length < 1) { return _ }
                let emptys = fonts.filter(x => !x || !x.name || srcTypes.every(s => !x[s]))
                if (emptys.length > 0) {
                    console.error(`Can\'t add font-face without name or any src :[${emptys.map(x => `'${(x || 0).name}'`).join(',')}]`)
                } else {
                    addFonts(fonts)
                }
                return _
            },
            /**
             * 下载完成或超时的回调  可以在任意时刻调用
             * @param {function} cb  (failedFonts: string[], loadedFonts: string[])=>{}  超时失败字体名称列表，已下载字体名称列表
             */
            load(cb) {
                typeof cb == 'function' && cbList.push(cb)
                if (!isWait) { startCheck() }
                return _
            },
            loadSync() {
                return new Promise(next => _.load((...a) => next(a)))
            },
            get statu() {
                return Object.assign({}, fontStatu)
            }
        }
    if (!issupport) { console.error(`${NAME} can\'t work accurately\nbecause [performance.getEntries] method is not support in your broswer!`) }
    return global[NAME] = _
})(this, document, 'fontLoader')