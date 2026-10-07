// 在這裡測試；當此封包作為擴充功能時，將不會編譯此內容。
input.onButtonPressed(Button.A, function () {
    dfplayerPro.playNum(4)
})
input.onButtonPressed(Button.AB, function () {
    basic.showString(dfplayerPro.queryVolume())
})
input.onButtonPressed(Button.B, function () {
    dfplayerPro.pausePlay()
})
dfplayerPro.init(SerialPin.P2, SerialPin.P1)
basic.pause(500)
dfplayerPro.setPlayMode(DFPlayMode.PlayOnce)
basic.pause(500)
dfplayerPro.setVolume(30)
basic.pause(500)
basic.showIcon(IconNames.Heart)
