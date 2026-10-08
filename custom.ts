enum DFPin {
    //% block="P0"
    P0,
    //% block="P1"
    P1,
    //% block="P2"
    P2,
    //% block="P8"
    P8,
    //% block="P12"
    P12,
    //% block="P13"
    P13,
    //% block="P14"
    P14,
    //% block="P15"
    P15
}

enum DFPlayMode {
    //% block="單曲循環"
    RepeatOne = 1,
    //% block="全部循環"
    RepeatAll = 2,
    //% block="播放一次就停"
    PlayOnce = 3,
    //% block="隨機播放"
    Random = 4,
    //% block="資料夾循環"
    FolderLoop = 5
}

enum DFQuery {
    //% block="目前播放的檔案編號"
    CurrentNumber = 1,
    //% block="檔案總數"
    TotalFiles = 2,
    //% block="已播放時間"
    CurrentTime = 3,
    //% block="檔案總時間"
    TotalTime = 4,
    //% block="目前播放的檔名"
    FileName = 5
}

//% weight=100 color=#E67E22 icon="\uf001" block="DFPlayer Pro"
namespace dfplayerPro {

    // 把選單的腳位轉成 MakeCode 的序列埠腳位
    function toPin(p: DFPin): SerialPin {
        switch (p) {
            case DFPin.P0: return SerialPin.P0
            case DFPin.P1: return SerialPin.P1
            case DFPin.P2: return SerialPin.P2
            case DFPin.P8: return SerialPin.P8
            case DFPin.P12: return SerialPin.P12
            case DFPin.P13: return SerialPin.P13
            case DFPin.P14: return SerialPin.P14
            case DFPin.P15: return SerialPin.P15
            default: return SerialPin.P1
        }
    }

    // 送出指令，結尾固定為 \r\n，送完等待讓模組處理
    function send(cmd: string): void {
        serial.writeString(cmd + "\r\n")
        basic.pause(500)
    }

    // 送出指令並讀取回應（內部使用）
    function sendAndRead(cmd: string): string {
        serial.readString()
        serial.writeString(cmd + "\r\n")
        basic.pause(600)
        return serial.readString()
    }

    // ===== 主分類（學生常用）=====

    /**
     * 每個程式一開始都要先放。會等待約 5 秒讓模組開機並完成準備，之後自動打開喇叭。
     * 選項請依模組上印的 TX、RX 接到的孔來選。
     */
    //% block="初始化 模組TX接 %modTx 模組RX接 %modRx"
    //% modTx.defl=DFPin.P1 modRx.defl=DFPin.P2
    //% weight=100
    export function init(modTx: DFPin, modRx: DFPin): void {
        // micro:bit 的 TX 腳＝模組 RX 接的腳；micro:bit 的 RX 腳＝模組 TX 接的腳
        serial.redirect(toPin(modRx), toPin(modTx), BaudRate.BaudRate115200)
        basic.pause(3000)
        // 喇叭先關，連送兩次切換，把「開機後第一次暫停會重播」用掉
        send("AT+AMP=OFF")
        send("AT+PLAY=PP")
        send("AT+PLAY=PP")
        send("AT+AMP=ON")
    }

    /**
     * 播放第 n 個檔案。編號依檔案拷貝進模組的順序，沒有該編號時會改播第一個。
     */
    //% block="播放第 %n 號檔案"
    //% n.min=1 n.defl=1
    //% weight=90
    export function playNum(n: number): void {
        send("AT+PLAYNUM=" + n)
    }

    /**
     * 播放中按一次會暫停，再按一次繼續。
     */
    //% block="暫停／繼續播放"
    //% weight=80
    export function pausePlay(): void {
        send("AT+PLAY=PP")
    }

    /**
     * 決定一首播完之後要怎麼做，例如重複播放或播完就停。
     */
    //% block="設定播放模式 %mode"
    //% weight=70
    export function setPlayMode(mode: DFPlayMode): void {
        send("AT+PLAYMODE=" + mode)
    }

    /**
     * 設定音量，範圍 0 到 30。
     */
    //% block="設定音量為 %vol"
    //% vol.min=0 vol.max=30 vol.defl=10
    //% weight=60
    export function setVolume(vol: number): void {
        vol = Math.constrain(vol, 0, 30)
        send("AT+VOL=" + vol)
    }

    /**
     * 打開或關閉喇叭，關閉就是靜音。
     */
    //% block="喇叭 %on"
    //% on.shadow="toggleOnOff" on.defl=true
    //% weight=50
    export function amp(on: boolean): void {
        send(on ? "AT+AMP=ON" : "AT+AMP=OFF")
    }

    // ===== 「更多」（進階）=====

    /**
     * 依檔名播放指定檔案一次。只要輸入檔名，不用加斜線和 .mp3。
     * 檔名請用英文、數字或底線，最多 8 個字，不要用中文或空格。
     */
    //% block="播放檔名 %name"
    //% name.defl="01"
    //% advanced=true
    //% weight=100
    export function playFile(name: string): void {
        // 若多打了開頭的斜線，先去掉
        if (name.charAt(0) == "/") {
            name = name.substr(1)
        }
        // 沒有副檔名時，預設補上 .mp3
        if (name.indexOf(".") < 0) {
            name = name + ".mp3"
        }
        send("AT+PLAYFILE=/" + name)
    }

    /**
     * 切到下一個檔案。
     */
    //% block="下一首"
    //% advanced=true
    //% weight=95
    export function next(): void {
        send("AT+PLAY=NEXT")
    }

    /**
     * 切到上一個檔案。
     */
    //% block="上一首"
    //% advanced=true
    //% weight=90
    export function last(): void {
        send("AT+PLAY=LAST")
    }

    /**
     * 往前快進或往後快退幾秒，負數為快退。
     */
    //% block="快進 %sec 秒（負數＝快退）"
    //% sec.defl=5
    //% advanced=true
    //% weight=80
    export function seekBy(sec: number): void {
        if (sec >= 0) {
            send("AT+TIME=+" + sec)
        } else {
            send("AT+TIME=" + sec)
        }
    }

    /**
     * 直接從第幾秒開始播放。
     */
    //% block="跳到第 %sec 秒開始播放"
    //% sec.min=0 sec.defl=0
    //% advanced=true
    //% weight=75
    export function seekTo(sec: number): void {
        send("AT+TIME=" + sec)
    }

    /**
     * 回傳目前音量（文字）。要接在「顯示文字」之類的積木上才看得到。
     */
    //% block="查詢音量"
    //% advanced=true
    //% weight=60
    export function queryVolume(): string {
        return sendAndRead("AT+VOL=?")
    }

    /**
     * 查詢播放狀態（文字），例如目前播第幾個檔案、已播放幾秒。要接在「顯示文字」上。
     */
    //% block="查詢 %q"
    //% advanced=true
    //% weight=55
    export function query(q: DFQuery): string {
        return sendAndRead("AT+QUERY=" + q)
    }

    /**
     * 開關模組開機時的提示音，設定會在斷電後保留。
     */
    //% block="提示音 %on"
    //% on.shadow="toggleOnOff"
    //% advanced=true
    //% weight=40
    export function prompt(on: boolean): void {
        send(on ? "AT+PROMPT=ON" : "AT+PROMPT=OFF")
    }

    /**
     * 開關模組上的指示燈，設定會在斷電後保留。
     */
    //% block="LED 指示燈 %on"
    //% on.shadow="toggleOnOff"
    //% advanced=true
    //% weight=35
    export function led(on: boolean): void {
        send(on ? "AT+LED=ON" : "AT+LED=OFF")
    }

    // ===== 不顯示在工具箱（寫 JavaScript 仍可呼叫）=====

    /**
     * 回傳模組對「AT」的回應，用來確認線有接對。
     */
    //% block="測試連線"
    //% blockHidden=true
    export function testConnection(): string {
        return sendAndRead("AT")
    }

    /**
     * 回傳目前的播放模式（文字）。
     */
    //% block="查詢播放模式"
    //% blockHidden=true
    export function queryPlayMode(): string {
        return sendAndRead("AT+PLAYMODE=?")
    }

    /**
     * 在目前音量上加減，正數變大、負數變小。
     */
    //% block="音量變化 %delta"
    //% delta.defl=1
    //% blockHidden=true
    export function changeVolume(delta: number): void {
        if (delta >= 0) {
            send("AT+VOL=+" + delta)
        } else {
            send("AT+VOL=" + delta)
        }
    }

    /**
     * 刪除正在播放的檔案，無法復原。
     */
    //% block="刪除目前播放的檔案（無法復原）"
    //% blockHidden=true
    export function deleteCurrentFile(): void {
        send("AT+DEL")
    }

    /**
     * 改模組的通訊速度，重新上電後生效。改了之後「初始化」會連不上。
     */
    //% block="設定模組鮑率 %baud（需重新上電）"
    //% baud.defl=115200
    //% blockHidden=true
    export function setBaudrate(baud: number): void {
        send("AT+BAUDRATE=" + baud)
    }
}