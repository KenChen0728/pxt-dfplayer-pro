// 在這裡測試；當此封包作為擴充功能時，將不會編譯此內容。
let loud = false
let muted = false

dfplayerPro.init(DFPin.P1, DFPin.P2)
dfplayerPro.setPlayMode(DFPlayMode.RepeatOne)
dfplayerPro.setVolume(20)
basic.showIcon(IconNames.Heart)

// A：播放第 4 號檔案
input.onButtonPressed(Button.A, function () {
    dfplayerPro.playNum(4)
})

// B：暫停／繼續
input.onButtonPressed(Button.B, function () {
    dfplayerPro.pausePlay()
})

// A+B：顯示已播放時間
input.onButtonPressed(Button.AB, function () {
    basic.showString(dfplayerPro.query(DFQuery.CurrentTime))
})

// 搖動：音量在 5 和 30 之間切換，並顯示查詢到的音量
input.onGesture(Gesture.Shake, function () {
    loud = !loud
    dfplayerPro.setVolume(loud ? 30 : 5)
    basic.showString(dfplayerPro.queryVolume())
})

// 螢幕朝下：喇叭靜音／恢復
input.onGesture(Gesture.ScreenDown, function () {
    muted = !muted
    dfplayerPro.amp(!muted)
})