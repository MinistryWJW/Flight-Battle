(function (global) {
    function rand() {
        return Math.random(Date.now())
    }
    function randIn(a, b) {
        if (typeof b == 'undefined') { b = a; a = 0 }
        return ~~(a + rand() * (b - a))
    }
    function enemy(type, png, burnPng, blood, speed, score, burnDuration = 300) {
        let box = new PIXI.Container,
            fly = PIXI.Sprite.fromImage(png),
            burn = new PIXI.extras.AnimatedSprite(burnPng.map(x => PIXI.utils.TextureCache[x]))
        burn.animationSpeed = .2
        burn.loop = false
        burn.visible = false
        box.addChild(fly, burn)
        box._data = { type, fly, burn, blood, maxblood: blood, speed, score, burnDuration }
        return box
    }
    //飞机道具
    // 敌机和道具放在一个容器
    // 通过type区分
    // prop1 全爆  prop2 散弹
    function props(png, type = 'prop1', speed = 1.5) {
        let s = PIXI.Sprite.fromImage(png)
        s._data = { type, speed }
        return s
    }
    const dir = '/image/', mdir = '/music/',
        config = {
            title: '飞机大战',
            rate: 1,
            get isgaming() {
                return this.currentPage == 'game' && !this.isgameover && !this.ispause
            },
            currentPage: 'home',
            allowSound: true,
            ispause: false,  //暂停游戏
            isgameover: false,  //游戏结束，停止移动和射击
            labels: {
                name: '“飞机大战”',
                desc: '玩家点击并移动自己的飞机， 在躲避迎面而来的其他飞机时 ，飞机通过发射炮弹打掉其他 飞机来获取分数。一旦撞上其 他飞机，游戏就结束 游戏中随机出现2种道具，吃到 了蓝色的双色炮弹，飞机会从两 边发射子弹，持续10秒；吃到 了导弹点击左下角的按钮可以炸 掉屏幕上的所有飞机。',
                back: '回到主菜单',
                score: '总得分: ',
                restart: '重新开始',
                newgame: '新游戏',
                setting: '设置',
                help: '游戏帮助',
                rate: '当前速率: %倍',
                rate_1: '1倍',
                rate_1_5: '1.5倍',
                rate_2: '2倍',
                continue: '继续'
            },
            width: 450, height: 798, score: 0,
            resources: {
                //'font:dir + '迷你简娃娃篆.ttf',
                bg: dir + 'background_1.png',
                sound: dir + 'horn.png',
                sound_off: dir + 'horn-no.png',
                pause: dir + 'pause.png',
                restore: dir + 'restore.png',
                bullet: dir + 'bullet1.png',
                enemy1: dir + 'enemy1_fly.png',
                enemy2: dir + 'enemy2_fly.png',
                enemy3: dir + 'enemy3_fly.png',
                fly: Array.from({ length: 2 }).map((x, i) => `${dir}飞机动画/飞机/${i}.png`),
                burn: Array.from({ length: 4 }).map((x, i) => `${dir}飞机动画/本方飞机爆炸/my_boom_${i}.png`),
                burn1: Array.from({ length: 4 }).map((x, i) => `${dir}飞机动画/小飞机爆炸/small_boom_${i}.png`),
                burn2: Array.from({ length: 4 }).map((x, i) => `${dir}飞机动画/中飞机爆炸/medium_boom_${i}.png`),
                burn3: Array.from({ length: 6 }).map((x, i) => `${dir}飞机动画/大飞机爆炸/large_boom_${i}.png`),
                blanket: dir + 'blanket.png',
                blast: dir + 'blast.png',
                ruinAll: dir + 'ruinAll.png',
                bgSound: mdir + 'bgmusic.mp3',
                shotSound: mdir + 'bullet.mp3',
                burn1Sound: mdir + 'enemy1_down.mp3',
                burn2Sound: mdir + 'enemy2_down.mp3',
                burn3Sound: mdir + 'enemy3_down.mp3',
                overSound: mdir + 'game_over.mp3'
            }
        }, Enemy = {
            fly1: () => new enemy('enemy1', config.resources.enemy1, config.resources.burn1, 2, rand() < .5 ? 2.5 : 3, 100),
            fly2: () => new enemy('enemy2', config.resources.enemy2, config.resources.burn2, 4, 1.5, 400, 320),
            fly3: () => new enemy('enemy3', config.resources.enemy3, config.resources.burn3, 8, 1, 1000, 430),
            props,
            is(x) { return /^enemy/i.test(x._data.type) },
            isprop(x) { return /^prop/i.test(x._data.type) },
        }, newPool = (f, size = 10) => {
            let r = Array.from({ length: size }).map(() => f())
            Object.defineProperty(r, '$new', {
                get() {
                    return r.length < 1 ? f() : r.pop()
                }
            })
            r.refill = () => {
                while (r.length < size) { r.push(f()) }
            }
            return r
        },
        Game = {
            config, Enemy, rand, randIn, newPool,
            newButton: function (text, outerWidth = 0, width = 200, height = 46) {
                let button = new PIXI.Container,
                    g = new PIXI.Graphics, g_click = new PIXI.Graphics
                t = new PIXI.Text(text, new PIXI.TextStyle({
                    fontFamily: 'wawa',
                    fontSize: 24,
                    fill: '#3c3e3e',
                    stroke: '#3c3e3e',
                    strokeThickness: 1,
                    letterSpacing: 2
                }))
                g.lineStyle(2, 0x515652, 1);
                g.beginFill(0xc3c7ca, 1);
                g.drawRoundedRect(0, 0, width, height, 16);
                g.endFill();
                g_click.lineStyle(2, 0x24282b, 1);
                g_click.beginFill(0x616564, 1);
                g_click.drawRoundedRect(0, 0, width, height, 16);
                g_click.endFill();
                g_click.visible = false
                t.x = (width - t.width) / 2
                t.y = (height - t.height - 4) / 2
                button.width = width
                button.height = height
                if (outerWidth > 0) { button.x = (outerWidth - width) / 2 }
                button.addChild(g, g_click, t)
                button.interactive = button.buttonMode = true
                function hideBg() { g.visible = true; g_click.visible = false }
                button.on('mouseover', () => { g.visible = false; g_click.visible = true })
                button.on('mouseout', hideBg)
                button.on('mouseup', hideBg)
                return button
            }
        }
    global.Game = Game
})(this);