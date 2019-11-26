PIXI.utils.sayHello(document.title)

function GameAPP() {
    const { config, newButton, rand, randIn, Enemy, newPool } = Game
    let app = new PIXI.Application({ width: config.width, height: config.height, antialias: true }),
        menuContainer = new PIXI.Container,
        gameContainer = new PIXI.Container,
        bgSprite, soundSprite,
        menuButtons = {
            help_back: 0,
            score_restart: 0, score_back: 0,
            home_start: 0, home_setting: 0, home_help: 0,
            rate_1: 0, rate_1_5: 0, rate_2: 0, rate_back: 0,
            game_continue: 0, game_restart: 0, game_back: 0
        },
        menuSubContainer = { home: new PIXI.Container, score: new PIXI.Container, rate: new PIXI.Container, help: new PIXI.Container },
        menuTexts = {
            title: new PIXI.Text(config.labels.name, new PIXI.TextStyle({
                //fontFamily: ["幼圆", "Microsoft YaHei", "黑体", "sans-serif"], 
                fontSize: 60,
                fontWeight: 'bold', fill: '#8f9293',
                strokeThickness: 3, letterSpacing: 12, align: 'center'
            })), descText: new PIXI.Text(config.labels.desc, new PIXI.TextStyle({
                fontFamily: 'wawa', fontSize: 24,
                fill: '#3c3e3e', stroke: '#3c3e3e',
                strokeThickness: 1, letterSpacing: 2,
                wordWrap: true,//wordWrapWidth: config.width-50
            })), rateText: new PIXI.Text(config.labels.rate.replace('%', config.rate), new PIXI.TextStyle({
                fontFamily: 'wawa', fontSize: 36,
                fill: '#3c3e3e', stroke: '#3c3e3e',
                strokeThickness: 1, letterSpacing: 2
            })), scoreText: new PIXI.Text(config.labels.score + config.score, new PIXI.TextStyle({
                fontFamily: 'wawa', fontSize: 36,
                fill: '#3c3e3e', stroke: '#3c3e3e',
                strokeThickness: 1, letterSpacing: 2
            }))
        },
        gamePortions = {
            flyContainer: new PIXI.Container, fly: 0, fly_burn: 0, pauseBtn: 0,
            score: new PIXI.Text(0, new PIXI.TextStyle({
                fontSize: 26, fill: '#3c3e3e', stroke: '#3c3e3e', strokeThickness: 1, letterSpacing: 2
            })),
            bulletContainer: new PIXI.Container, enemyContainer: new PIXI.Container,
            ruinContainer: new PIXI.Container, pauseMenu: new PIXI.Container,
            ruinText: new PIXI.Text('x0', new PIXI.TextStyle({
                fontFamily: 'wawa', fontSize: 36, fill: '#3c3e3e', stroke: '#3c3e3e', strokeThickness: 1, letterSpacing: 2
            })),
            menu_continue: 0, menu_restart: 0, menu_back: 0
        }, bullets = {
            tick: 200,  //射击子弹间隔
            lastTime: 0,  //上次射击时间
            speed: 5,
            ruinCount: 0,//全爆道具数量
            strongTick: 50,  //持续次数 (以发射次数为准)
            strongUsed: 0    //消耗次数  每次发射散弹-1  有则直接开启散弹火力
        },
        enemys = { lastTime: 0, waitProp: 0, nextProp: () => randIn(300, 800) },  //下一次出现随机道具的动画帧次数
        pools = { bullet: 0, enemy1: 0, enemy2: 0, enemy3: 0 },
        sound = { bg: 0, shot: 0, burn1: 0, burn2: 0, burn3: 0, over: 0 },
        keyborad = { top: 0, left: 0, right: 0, bottom: 0 }
    /**
     * 切换游戏页面
     * 注意：home 和 game 页面显示喇叭，其他则不显示
     * @param {string} name   必须是一下值之一 home|score|rate|help|game
     */
    function showMenu(name) {
        if (name == 'game') {
            config.currentPage = name
            gameContainer.visible = true
            menuContainer.visible = false
            startNewGame()
        } else {
            config.ispause = config.isgameover = true;
            ['home', 'score', 'rate', 'help'].filter(x => x != name).map(x => menuSubContainer[x].visible = false)
            if (menuSubContainer[name]) {
                config.currentPage = name
                gameContainer.visible = false
                menuContainer.visible = true
                menuSubContainer[name].visible = true
            }
        }
        soundSprite.visible = ['home', 'game'].includes(name)
    }

    PIXI.loader.add(Object.keys(config.resources).reduce((a, b) => a.concat(config.resources[b]), []))
        .load(onLoad)
    function castPosition(elem, marginTop, top = 0) {
        var { width } = config, y = top
        elem.map(e => {
            e.x = (width - e.width) / 2
            e.y = y
            y += e.height + marginTop
        })
        return elem
    }
    function centerPosition(marginTop, elem) {
        var { width, height } = config,
            h = marginTop * ((elem.length || 1) - 1) + elem.reduce((a, b) => a + b.height, 0),
            y = (height - h) / 2
        elem.map(e => {
            e.x = (width - e.width) / 2
            e.y = y
            y += e.height + marginTop
        })
        return elem
    }

    function initSound(res) {
        sound.bg = res[config.resources.bgSound].sound
        sound.shot = res[config.resources.shotSound].sound
        sound.burn1 = res[config.resources.burn1Sound].sound
        sound.burn2 = res[config.resources.burn2Sound].sound
        sound.burn3 = res[config.resources.burn3Sound].sound
        sound.over = res[config.resources.overSound].sound
        let { bg, shot, burn3, over } = sound
        bg.singleInstance = shot.singleInstance = bg.loop = shot.loop = true
        bg.volume = .5
        shot.volume = .8
        burn3.speed = over.speed = 2
    }
    function initButtons(help_width) {
        let t = config.labels, w = config.width
        menuButtons.home_start = newButton(t.newgame, w)
        menuButtons.home_setting = newButton(t.setting, w)
        menuButtons.home_help = newButton(t.help, w)
        menuButtons.rate_1 = newButton(t.rate_1, w)
        menuButtons.rate_1_5 = newButton(t.rate_1_5, w)
        menuButtons.rate_2 = newButton(t.rate_2, w)
        menuButtons.rate_back = newButton(t.back, w)
        menuButtons.score_restart = newButton(t.restart, w)
        menuButtons.score_back = newButton(t.back, w)
        menuButtons.help_back = newButton(t.back, help_width)
        menuButtons.game_continue = newButton(t.baccontinuek, w)
        menuButtons.game_restart = newButton(t.restart, w)
        menuButtons.game_back = newButton(t.back, w)
    }
    function initButtonsEvent() {
        let { help_back,
            score_restart, score_back,
            home_start, home_setting, home_help,
            rate_1, rate_1_5, rate_2, rate_back,
            // game_continue, game_restart, game_back 
        } = menuButtons,
            toHome = () => showMenu('home'),
            toGame = () => showMenu('game'),
            toHelp = () => showMenu('help'),
            toRate = () => showMenu('rate'),
            Rate = n => () => {
                config.rate = n;
                menuTexts.rateText.text = config.labels.rate.replace('%', config.rate)
            }
        home_start.on('pointerdown', toGame)
        home_help.on('pointerdown', toHelp)
        home_setting.on('pointerdown', toRate)
        score_back.on('pointerdown', toHome)
        help_back.on('pointerdown', toHome)
        rate_1.on('pointerdown', Rate(1))
        rate_1_5.on('pointerdown', Rate(1.5))
        rate_2.on('pointerdown', Rate(2))
        rate_back.on('pointerdown', toHome)
        //game_back.on('pointerdown' , toHome)
        score_restart.on('pointerdown', () => showMenu('game'))
    }
    function initMenuStage() {
        let { title, descText, rateText, scoreText } = menuTexts, { home, score, rate, help } = menuSubContainer
        title.x = (config.width - title.width) / 2
        title.y = 160
        descText.x = (config.width - descText.width) / 2;
        [home, score, rate, help].map(x => x.y = title.y + title.height + 20)
        initButtons(config.width)
        initButtonsEvent()
        let { help_back, score_restart, score_back,
            home_start, home_setting, home_help, rate_1, rate_1_5, rate_2, rate_back,
            // game_continue, game_restart, game_back
        } = menuButtons
        home_start.y = 80
        home_setting.y = home_start.y + 70
        home_help.y = home_setting.y + 70
        home.addChild(home_start, home_setting, home_help)
        help_back.y = descText.height + 20
        help.addChild(descText, help_back)
        score.addChild(...castPosition([scoreText, score_restart, score_back], 20, 60))
        rateText.x = (config.width - rateText.width) / 2;
        rateText.y = 30
        rate_1.y = rateText.y + 80
        rate_1_5.y = rate_1.y + 60
        rate_2.y = rate_1_5.y + 60
        rate_back.y = rate_2.y + 60
        rate.addChild(rateText, rate_1, rate_1_5, rate_2, rate_back)
        menuContainer.addChild(title, help, rate, home, score)
        showMenu('home')
    }
    function initGameStage() {
        let { flyContainer, bulletContainer, enemyContainer, score, pauseMenu, ruinContainer, ruinText } = gamePortions,
            fly = gamePortions.fly = new PIXI.extras.AnimatedSprite(config.resources.fly.map(x => PIXI.utils.TextureCache[x])),
            fly_burn = gamePortions.fly_burn = new PIXI.extras.AnimatedSprite(config.resources.burn.map(x => PIXI.utils.TextureCache[x]))
        fly.animationSpeed = .1
        fly_burn.animationSpeed = .1
        fly_burn.loop = false
        fly_burn.visible = false
        flyContainer.addChild(fly, fly_burn)
        gameContainer.width = config.width
        gameContainer.height = config.height
        let pauseBtn = gamePortions.pauseBtn = PIXI.Sprite.fromImage(config.resources.pause)
        pauseBtn.x = 15
        pauseBtn.y = score.y = 15
        score.x = pauseBtn.x + pauseBtn.width + 10
        let t = config.labels, { width, height } = config,
            _continue = gamePortions.menu_continue = newButton(t.continue, width),
            _restart = gamePortions.menu_restart = newButton(t.restart, width),
            _back = gamePortions.menu_back = newButton(t.back, width),
            marginTop = 12, _h = _continue.height,
            _height = _continue.height * 3 + marginTop * 2
        _continue.x = _restart.x = _back.x = (width - _continue.width) / 2
        _continue.y = (height - _height) / 2
        _restart.y = _continue.y + _h + marginTop
        _back.y = _restart.y + _h + marginTop
        pauseMenu.addChild(_continue, _restart, _back)
        pauseMenu.visible = false
        let ruinIcon = PIXI.Sprite.fromImage(config.resources.ruinAll)
        ruinContainer.x = 10
        ruinContainer.y = height - ruinIcon.height - 10
        ruinText.x = ruinIcon.width + 10
        ruinText.y = (ruinIcon.height - ruinText.height) / 2 - 5
        ruinContainer.addChild(ruinIcon, ruinText)
        gameContainer.addChild(bulletContainer, enemyContainer, score, pauseBtn, ruinContainer, flyContainer, pauseMenu)
        // 初始化飞机缓存池
        pools.bullet = newPool(() => PIXI.Sprite.fromImage(config.resources.bullet), 50)
        pools.enemy1 = newPool(Enemy.fly1, 30)
        pools.enemy2 = newPool(Enemy.fly2, 20)
        pools.enemy3 = newPool(Enemy.fly3, 10)
        initGameEvent()
    }
    function makeClickable(...el) {
        el.map(x => x.interactive = x.buttonMode = true)
    }
    function ensureBoundary(x, y, el) {
        let w = config.width - el.width, h = config.height - el.height
        if (x < 0) { x = 0 }
        if (x > w) { x = w }
        if (y < 0) { y = 0 }
        if (y > h) { y = h }
        el.x = x, el.y = y
    }
    function testCrossX(s1, s2, delta = 0) {
        return Math.abs(s1.x + s1.width / 2 - s2.x - s2.width / 2) <= (s1.width + s2.width) / 2 + delta
    }
    function testCrossY(s1, s2, delta = 0) {
        return Math.abs(s1.y + s1.height / 2 - s2.y - s2.height / 2) <= (s1.height + s2.height) / 2 + delta
    }
    function initGameEvent() {
        let { flyContainer, enemyContainer, pauseBtn, fly, pauseMenu, menu_continue, menu_restart, menu_back, ruinContainer, ruinText } = gamePortions
        makeClickable(flyContainer, pauseBtn, ruinContainer)
        ruinContainer.on('pointerdown', ruinEnemys)
        pauseBtn.on('pointerdown', togglePause)
        menu_continue.on('pointerdown', () => {
            config.ispause = pauseMenu.visible = false
            pauseBtn.texture = PIXI.utils.TextureCache[config.resources.pause]
            fly.gotoAndPlay(0)
            app.ticker.add(gameTicker, this)
            if (config.allowSound) { PIXI.sound.unmuteAll() }
        })
        menu_restart.on('pointerdown', () => { startNewGame() })
        menu_back.on('pointerdown', () => { showMenu('home') })
        gameContainer.interactive = true
        flyContainer._drag = { ispress: false, pressXY: 0, pressPos: 0 };
        flyContainer.on('pointerdown', function (e) {
            if (!config.isgaming) { return }
            let t = this
            if (e.target == t) {
                let { _drag: _ } = t
                _.ispress = true, _.pressXY = Object.assign({}, e.data.global)
                _.pressPos = { x: t.x, y: t.y }
            }
        })
        gameContainer.on('pointermove', function (e) {
            if (!config.isgaming) { return }
            let t = flyContainer, { ispress, pressXY, pressPos } = t._drag
            if (ispress) {
                ensureBoundary(pressPos.x + e.data.global.x - pressXY.x, pressPos.y + e.data.global.y - pressXY.y, t)
            }
        })
        window.addEventListener('pointerup', function (e) {
            flyContainer._drag.ispress = false
        })
        document.addEventListener('keydown', e => {
            if (config.currentPage != 'game' || config.isgameover) { return }
            let { keyCode: code } = e
            // 32空格暂停反转
            if (code == 32) {
                e.stopPropagation()
                e.preventDefault()
                return togglePause()
            }
            if (config.ispause) { return }
            // 13回车键全爆
            if (code == 13) {
                e.stopPropagation()
                e.preventDefault()
                return ruinEnemys()
            }
            // 38上  37左  39右  40下 
            switch (code) {
                case 38: keyborad.top = 1; break;
                case 37: keyborad.left = 1; break;
                case 39: keyborad.right = 1; break;
                case 40: keyborad.bottom = 1; break;
                default: return
            }
        })
        document.addEventListener('keyup', e => {
            let { keyCode: code } = e
            // 38上  37左  39右  40下  
            switch (code) {
                case 38: keyborad.top = 0; break;
                case 37: keyborad.left = 0; break;
                case 39: keyborad.right = 0; break;
                case 40: keyborad.bottom = 0; break;
                default: return
            }
        })
    }
    function ruinEnemys() {
        if (!config.isgaming || bullets.ruinCount < 1) { return }
        let gp = gamePortions
        gp.ruinText.text = 'x' + (--bullets.ruinCount)
        gp.enemyContainer.children.map(killEnemy)
    }
    function togglePause() {
        let p = config.ispause = !config.ispause;
        (p ? pauseGame : resumeGame)()
    }
    function pauseGame() {
        if (!config.ispause) { return }
        let { fly, pauseMenu, pauseBtn } = gamePortions
        pauseMenu.visible = true
        pauseBtn.texture = PIXI.utils.TextureCache[config.resources.restore]
        fly.stop()
        app.ticker.remove(gameTicker, this)
        if (config.allowSound) { PIXI.sound.muteAll() }

    }
    function resumeGame() {
        if (config.ispause) { return }
        let { fly, pauseMenu, pauseBtn } = gamePortions
        pauseMenu.visible = false
        pauseBtn.texture = PIXI.utils.TextureCache[config.resources.pause]
        fly.gotoAndPlay(0)
        app.ticker.add(gameTicker, this)
        if (config.allowSound) { PIXI.sound.unmuteAll() }

    }
    function startNewGame() {
        app.ticker.remove(gameTicker, this)
        config.ispause = config.isgameover = false
        enemys.lastTime = 0
        enemys.waitProp = enemys.nextProp()
        bullets.strongUsed = bullets.ruinCount = 0
        //bullets.strongUsed = bullets.strongTick
        let { bulletContainer, flyContainer, enemyContainer, pauseBtn, score, fly, fly_burn, pauseMenu, ruinText } = gamePortions
        bulletContainer.removeChildren()
        enemyContainer.removeChildren()
        pauseBtn.texture = PIXI.utils.TextureCache[config.resources.pause]
        pauseMenu.visible = fly_burn.visible = false
        score.text = config.score = 0
        ruinText.text = 'x0'
        flyContainer.x = (config.width - fly.width) / 2
        flyContainer.y = config.height - fly.height - 20
        fly.visible = true
        fly.gotoAndPlay(0);
        // 填充缓存池，避免某些飞机子弹没有被回收
        ['bullet', 'enemy1', 'enemy2', 'enemy3'].map(x => pools[x].refill())
        if (config.allowSound) {
            PIXI.sound.unmuteAll()
            sound.bg.play()
            sound.shot.play()
        }
        app.ticker.add(gameTicker, this)
    }
    function checkKeybroadMove() {
        let x = 0, y = 0, _x = 6, _y = 5
        if (keyborad.top) { y = -_y }
        if (keyborad.left) { x = -_x }
        if (keyborad.right) { x = _x }
        if (keyborad.bottom) { y = _y }
        if (x == 0 && y == 0) { return }
        let { flyContainer: fly } = gamePortions
        ensureBoundary(fly.x + x, fly.y + y, fly)
    }
    function ejectBullet() {
        let { bulletContainer, flyContainer } = gamePortions,
            { tick, lastTime } = bullets, now = Date.now()
        if (!lastTime || now - lastTime >= tick) {
            let { x, y, width } = flyContainer, sprite = []
            if (bullets.strongUsed > 0) {
                let s = pools.bullet.$new
                s.x = x + 8; s.y = y - s.height + 25
                sprite.push(s)
                s = pools.bullet.$new
                s.x = x + width - 14; s.y = y - s.height + 25
                sprite.push(s)
                --bullets.strongUsed
            } else {
                let s = pools.bullet.$new
                s.x = x + (width - s.width) / 2 + 1; s.y = y - s.height + 5
                sprite.push(s)
            }
            bulletContainer.addChild(...sprite)
            bullets.lastTime = now
        }
        bulletContainer.children.map(s => {
            s.y -= bullets.speed
            if (s.y < -1 * s.height - 10) {
                bulletContainer.removeChild(s)
                pools.bullet.push(s)
            }
        })
    }
    function killEnemy(e) {
        let { _data: data } = e, { enemyContainer: box } = gamePortions
        if (Enemy.is(e)) {
            let { fly, burn, burnDuration, score } = data
            data.blood = 0
            gamePortions.score.text = config.score += score
            fly.visible = false
            burn.visible = true
            burn.gotoAndPlay(0)
            type = data.type.replace(/\D/g, '')
            sound['burn' + type].play()
            setTimeout(() => {
                box.removeChild(e)
                // 根据 type=enemy123 回收到缓存池
                pools['enemy' + type].push(e)
            }, burnDuration)
        } else if (Enemy.isprop(e)) {
            let { type } = data
            if (type == 'prop1') {
                gamePortions.ruinText.text = 'x' + (++bullets.ruinCount)
            } else if (type == 'prop2') {
                bullets.strongUsed = bullets.strongTick
            }
            // 道具透明消失
            function next() {
                if ((e.alpha -= .03) <= 0) {
                    return box.removeChild(e)
                }
                requestAnimationFrame(next)
            }
            e.alpha -= .1
            //requestAnimationFrame(next)
            let tween = new TWEEN.Tween(e);
            tween.to({ alpha: 0 }, 500).onComplete(function () {
                box.removeChild(e)
                TWEEN.remove(tween);
            }).start();
        }
    }
    function enemyMove() {
        let { lastTime } = enemys, wait = randIn(600, 850), now = Date.now(),
            { width, height } = config,
            { enemyContainer: box } = gamePortions
        if (!lastTime || now - lastTime >= wait) {
            let enemy, r = rand(), type;
            if (box.children.length < 3) { type = 1 }
            else { type = r < .7 ? 1 : r < .92 ? 2 : 3 }
            enemy = pools['enemy' + type].$new
            let { _data: data } = enemy, { fly, burn } = data
            fly.visible = true
            burn.visible = false
            data.blood = data.maxblood
            enemy.y = -fly.height - 5
            enemy.x = randIn(width - fly.width)
            box.addChild(enemy)
            enemys.lastTime = now
        }
        //检测产生道具
        if (--enemys.waitProp <= 0) {
            let isruin = rand() < .5, type = isruin ? 'prop1' : 'prop2', png = config.resources[isruin ? 'blast' : 'blanket'],
                prop = Enemy.props(png, type)
            prop.y = -prop.height - 5
            prop.x = randIn(width - prop.width)
            box.addChild(prop)
            enemys.waitProp = enemys.nextProp()
        }
        box.children.map(s => {
            let { _data: data } = s
            if (Enemy.is(s) && data.blood == 0) { return }
            s.y += data.speed * config.rate
            if (s.y > height + 10) {
                box.removeChild(s)
                if (Enemy.is(s)) {
                    let { type } = data
                    // 根据 type=enemy123 回收到缓存池
                    pools['enemy' + type.replace(/\D/g, '')].push(s)
                }
            }
        })
    }
    function checkHintEnemy() {
        let { bulletContainer: bc, enemyContainer: ec } = gamePortions,
            bs = bc.children, es = ec.children.filter(x => (Enemy.isprop(x) && x.alpha == 1) || x._data.blood > 0)  //排除刚炸掉的敌机 和透明消失中的道具
        if (bs.length < 1 || es.length < 1) { return }
        let xlist = bs.reduce((a, b) => {
            if (!(b.x in a)) {
                var s = es.filter(e => testCrossX(e, b))
                if (s.length > 0) { a[b.x] = s }
            }
            return a
        }, {})
        bs.map(b => {
            let inline = xlist[b.x]
            if (!inline || inline.length < 1) { return }
            inline.map(e => {
                if (testCrossY(e, b)) {
                    if (Enemy.isprop(e) || (Enemy.is(e) && --e._data.blood <= 0)) { killEnemy(e) }
                    bc.removeChild(b)
                    pools.bullet.push(b)
                }
            })
        })
    }
    function checkCrashFly() {
        let { flyContainer: fc, fly, fly_burn, enemyContainer: ec } = gamePortions
        for (let e of ec.children.filter(x => (Enemy.isprop(x) && x.alpha == 1) || x._data.blood > 0)) { //排除刚炸掉的敌机 和透明消失中的道具
            if (testCrossX(e, fc) && testCrossY(e, fc)) {
                if (Enemy.is(e)) {
                    config.isgameover = true
                    fly.visible = false
                    fly_burn.visible = true
                    fly_burn.gotoAndPlay(0)
                    let { scoreText: st } = menuTexts
                    st.text = config.labels.score + config.score
                    st.x = (config.width - st.width) / 2
                    if (config.allowSound) {
                        sound.bg.stop()
                        sound.shot.stop()
                        sound.over.play()
                    }
                    setTimeout(() => showMenu('score'), 400)
                    app.ticker.remove(gameTicker, this)
                } else if (Enemy.isprop(e)) {
                    killEnemy(e)
                }
            }
        }
    }
    /**
     *  初始化所有容器和部件
     */
    function onLoad(loader, res) {
        //bgSprite = new PIXI.Sprite(PIXI.utils.TextureCache[config.resources.bg])
        bgSprite = PIXI.Sprite.fromImage(config.resources.bg)
        bgSprite.width = config.width
        bgSprite.height = config.height
        soundSprite = PIXI.Sprite.fromImage(config.resources.sound)
        soundSprite.width = 70
        soundSprite.height = 50
        soundSprite.x = config.width - soundSprite.width - 15
        soundSprite.y = 10
        makeClickable(soundSprite)
        soundSprite.on('pointerdown', () => {
            let on = !config.allowSound
            config.allowSound = on
            soundSprite.texture = PIXI.utils.TextureCache[config.resources['sound' + (on ? '' : '_off')]]
            soundSprite.x += on ? -3 : 3
            if (config.currentPage != 'game' || config.isgameover || config.ispause) { return }
            if (on) {
                PIXI.sound.unmuteAll()
            } else {
                PIXI.sound.muteAll()
            }
        })
        initSound(res)
        initMenuStage()
        initGameStage()
        app.stage.addChild(bgSprite, soundSprite, menuContainer, gameContainer)
        //showMenu('score')

    }
    app.renderer.backgroundColor = 0xffffff
    function gameTicker(delta) {
        if (config.isgaming) {
            TWEEN.update()
            checkKeybroadMove()
            ejectBullet()
            enemyMove()
            checkHintEnemy()
            checkCrashFly()
        }
    }
    document.body.appendChild(app.view).id = "game-app"
    Object.assign(window, { app, pools, sound })
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (config.isgaming) {
                config.ispause = true
                pauseGame()
            }
        }
    })
}
console.table({
    '图像对象池': '√',
    '游戏声音': '√',
    '游戏debug及显示优化': '√',
    '游戏键盘操作': '√',
    '多边形碰撞检测': '×'
})