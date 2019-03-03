import Immutable from 'seamless-immutable'
const phantom = require('phantom')

const KABUTAN_BASE_URL = 'https://kabutan.jp/stock/chart'

export default class Kabutan {
  constructor () {
    // 画面サイズ
    this._viewportSize = Immutable({
      width: 1920,
      height: 1080
    })

    // 切り抜き位置(株探チャート用)
    this._clipRect = Immutable({
      top: 518,
      left: 475,
      width: 640,
      height: 405
    })
  }

  viewportSize (size) {
    this._viewportSize.merge(size)

    return this
  }

  clipRect (size) {
    this._clipRect.merge(size)

    return this
  }

  createKabutanUrl (code) {
    let kabutan = new URL(KABUTAN_BASE_URL)
    kabutan.search = `code=${code}`

    return kabutan
  }

  async openPage (url, callback) {
    const instance = await phantom.create()

    const page = await instance.createPage()
    page.property('viewportSize', this._viewportSize)
    page.property('clipRect', this._clipRect)

    const status = await page.open(url.toString())

    await callback(page)

    await page.close()
    await instance.exit()
  }

  async openPageByCode (code, callback) {
    const url = this.createKabutanUrl(code)
    return this.openPage(url, callback)
  }
}