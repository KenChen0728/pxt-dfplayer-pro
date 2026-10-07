enum DFPlayMode {
    //% block="單曲循環"
    RepeatOne = 1,
    //% block="全部循環"
    RepeatAll = 2,
    //% block="單曲播放完暫停"
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

    // 送出指令，結尾固定為 \r\n，送完等待讓模組處理
    function send(cmd: string): void {
        serial.writeString(cmd + "\r\n")
        basic.pause(500)
    }

    // 送出指令並讀取回應（內部使用）
    function sendAndRead(cmd: string): string {
        serial.readString()
        send(cmd)
        basic.pause(600)
        return serial.readString()
    }

    //% block="初始化 模組TX接 %modTx 模組RX接 %modRx"
    //% modTx.defl=SerialPin.P2 modRx.defl=SerialPin.P1
    //% group="基本"
    export function init(modTx: SerialPin, modRx: SerialPin): void {
        // micro:bit 的 TX 腳＝模組 RX 接的腳；micro:bit 的 RX 腳＝模組 TX 接的腳
        serial.redirect(modRx, modTx, BaudRate.BaudRate115200)
        basic.pause(3000)
        send("AT+AMP=ON")
        basic.pause(300)
    }

    //% block="測試連線"
    //% group="基本"
    export function testConnection(): string {
        return sendAndRead("AT")
    }

    //% block="喇叭功放 %on"
    //% on.shadow="toggleOnOff"
    //% group="基本"
    export function amp(on: boolean): void {
        send(on ? "AT+AMP=ON" : "AT+AMP=OFF")
    }

    //% block="播放第 %n 號檔案"
    //% n.min=1 n.defl=1
    //% group="播放"
    export function playNum(n: number): void {
        send("AT+PLAYNUM=" + n)
    }

    //% block="播放檔案 %path"
    //% path.defl="/test.mp3"
    //% group="播放"
    export function playFile(path: string): void {
        send("AT+PLAYFILE=" + path)
    }

    //% block="暫停／繼續播放"
    //% group="播放"
    export function pausePlay(): void {
        send("AT+PLAY=PP")
    }

    //% block="下一首"
    //% group="播放"
    export function next(): void {
        send("AT+PLAY=NEXT")
    }

    //% block="上一首"
    //% group="播放"
    export function last(): void {
        send("AT+PLAY=LAST")
    }

    //% block="設定播放模式 %mode"
    //% group="播放"
    export function setPlayMode(mode: DFPlayMode): void {
        send("AT+PLAYMODE=" + mode)
    }

    //% block="查詢播放模式"
    //% group="播放"
    export function queryPlayMode(): string {
        return sendAndRead("AT+PLAYMODE=?")
    }

    //% block="快進／快退 %sec 秒（負數為快退）"
    //% sec.defl=5
    //% group="時間"
    export function seekBy(sec: number): void {
        if (sec >= 0) {
            send("AT+TIME=+" + sec)
        } else {
            send("AT+TIME=" + sec)
        }
    }

    //% block="跳到第 %sec 秒開始播放"
    //% sec.min=0 sec.defl=0
    //% group="時間"
    export function seekTo(sec: number): void {
        send("AT+TIME=" + sec)
    }

    //% block="查詢 %q"
    //% group="查詢"
    export function query(q: DFQuery): string {
        return sendAndRead("AT+QUERY=" + q)
    }

    //% block="設定音量為 %vol"
    //% vol.min=0 vol.max=30 vol.defl=10
    //% group="音量"
    export function setVolume(vol: number): void {
        vol = Math.constrain(vol, 0, 30)
        send("AT+VOL=" + vol)
    }

    //% block="音量變化 %delta"
    //% delta.defl=1
    //% group="音量"
    export function changeVolume(delta: number): void {
        if (delta >= 0) {
            send("AT+VOL=+" + delta)
        } else {
            send("AT+VOL=" + delta)
        }
    }

    //% block="查詢音量"
    //% group="音量"
    export function queryVolume(): string {
        return sendAndRead("AT+VOL=?")
    }

    //% block="提示音 %on"
    //% on.shadow="toggleOnOff"
    //% group="設定"
    export function prompt(on: boolean): void {
        send(on ? "AT+PROMPT=ON" : "AT+PROMPT=OFF")
    }

    //% block="LED 指示燈 %on"
    //% on.shadow="toggleOnOff"
    //% group="設定"
    export function led(on: boolean): void {
        send(on ? "AT+LED=ON" : "AT+LED=OFF")
    }

    //% block="刪除目前播放的檔案（無法復原）"
    //% group="進階（小心使用）"
    export function deleteCurrentFile(): void {
        send("AT+DEL")
    }

    //% block="設定模組鮑率 %baud（需重新上電）"
    //% baud.defl=115200
    //% group="進階（小心使用）"
    export function setBaudrate(baud: number): void {
        send("AT+BAUDRATE=" + baud)
    }
}