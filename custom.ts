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
    TotalTime = 4
}

//% weight=100 color=#E67E22 icon="" block="DFPlayer Pro"
namespace dfplayerPro {

    // ===== 播放狀態記錄（學生看不到）=====
    // 模組只有「播放／暫停切換」一個指令，不會回報現在的狀態，
    // 所以由程式自己記：程式以為現在有沒有在播、有沒有按過「停止」、最後播的檔案編號。
    let playing = false
    let stopped = false
    let lastNum = 1

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

    // 從回應文字裡取出第一串數字，取不到回傳 -1
    function toNum(s: string): number {
        let n = 0
        let found = false
        for (let i = 0; i < s.length; i++) {
            let c = s.charCodeAt(i)
            if (c >= 48 && c <= 57) {
                n = n * 10 + (c - 48)
                found = true
            } else if (found) {
                break
            }
        }
        return found ? n : -1
    }

    // 歌是不是已經自然播完：已播放時間 ≥ 檔案總時間
    // （實測「播放一次就停」播完後，已播放時間會停在總時間）
    function songFinished(): boolean {
        let cur = toNum(sendAndRead("AT+QUERY=3"))
        let tot = toNum(sendAndRead("AT+QUERY=4"))
        return cur >= 0 && tot > 0 && cur >= tot
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
        // 實測：初始化完成後模組是停著的
        playing = false
        stopped = false
    }

    /**
     * 播放第 n 個檔案。編號依檔案拷貝進模組的順序，沒有該編號時會改播第一個。
     */
    //% block="播放第 %n 號檔案"
    //% n.min=1 n.defl=1
    //% weight=90
    export function playNum(n: number): void {
        send("AT+PLAYNUM=" + n)
        playing = true
        stopped = false
        lastNum = n
    }

    /**
     * 暫停播放，停在目前的位置。已經暫停時不會有動作，放在「重複無限次」裡也只會暫停一次。
     * 歌如果已經自然播完，也不會再送出指令。
     */
    //% block="暫停"
    //% weight=82
    export function pause(): void {
        if (!playing) {
            return
        }
        if (songFinished()) {
            // 歌已經播完，模組其實是停著的，不要再送切換指令（會變成重播）
            playing = false
            return
        }
        send("AT+PLAY=PP")
        playing = false
    }

    /**
     * 從暫停的地方接著播放。按過「停止」之後，會從頭開始播。
     * 正在播放時不會有動作。
     */
    //% block="繼續播放"
    //% weight=81
    export function resume(): void {
        if (stopped) {
            stopped = false
            playNum(lastNum)
        } else if (!playing) {
            send("AT+PLAY=PP")
            playing = true
        }
    }

    /**
     * 停止播放。之後按「繼續播放」會從頭開始。
     */
    //% block="停止"
    //% weight=79
    export function stop(): void {
        pause()
        // 先問模組現在播第幾個，這樣用過「下一首」「上一首」也能從正確的檔案重播
        let n = toNum(sendAndRead("AT+QUERY=1"))
        if (n > 0) {
            lastNum = n
        }
        stopped = true
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
     * 依檔名播放指定檔案一次，播完就停。只要輸入檔名，不用加 .mp3。
     * 檔名要和模組裡的檔名完全一致（3 和 03 不同），找不到時會改播第一個。
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
        playing = true
        stopped = false
    }

    /**
     * 切到下一個檔案。
     */
    //% block="下一首"
    //% advanced=true
    //% weight=95
    export function next(): void {
        send("AT+PLAY=NEXT")
        playing = true
        stopped = false
    }

    /**
     * 切到上一個檔案。
     */
    //% block="上一首"
    //% advanced=true
    //% weight=90
    export function last(): void {
        send("AT+PLAY=LAST")
        playing = true
        stopped = false
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
     * 在目前音量上加減，正數變大、負數變小。
     */
    //% block="音量增加 %delta（負數＝減小）"
    //% delta.defl=1
    //% advanced=true
    //% weight=65
    export function changeVolume(delta: number): void {
        if (delta >= 0) {
            send("AT+VOL=+" + delta)
        } else {
            send("AT+VOL=" + delta)
        }
    }

    /**
     * 回傳目前音量（文字，例如 VOL=[24]）。要接在「顯示文字」之類的積木上才看得到。
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
     * 舊版的「暫停／繼續播放」切換積木，每按一次就切換一次。
     * 已改用「暫停」「繼續播放」「停止」三個積木；這個保留是為了讓舊程式不會壞掉。
     */
    //% block="暫停／繼續播放（舊）"
    //% blockHidden=true
    export function pausePlay(): void {
        send("AT+PLAY=PP")
        playing = !playing
    }

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