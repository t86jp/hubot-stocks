import Immutable from 'seamless-immutable'
const phantom = require('phantom')

const KABUTAN_BASE_URL = 'https://kabutan.jp/stock/chart'

function wait (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

export default class Kabutan {
  constructor () {
    // 画面サイズ
    this.defaultViewportSize = Immutable({
      width: 1920,
      height: 1080
    })

    // 切り抜き位置(株探チャート用)
    this.defaultClipRect = Immutable({
      top: 518,
      left: 475,
      width: 640,
      height: 405
    })
  }

  createKabutanUrl (code) {
    let kabutan = new URL(KABUTAN_BASE_URL)
    kabutan.search = `code=${code}`

    return kabutan
  }

  async openPage (url, callback) {
    const instance = await phantom.create()

    const page = await instance.createPage()
    page.property('viewportSize', this.defaultViewportSize)

    const status = await page.open(url.toString())

    await callback(page)

    await page.close()
    await instance.exit()
  }

  async openPageByCode (code, callback) {
    const url = this.createKabutanUrl(code)
    return this.openPage(url, callback)
  }

  saveChartImage (stockNumber, filename, evaluate) {
    let saveImagePromise = new Promise((resolve, reject) => {
      try {
        this.openPageByCode(stockNumber, async (page) => {
          let evaluatePromise = evaluate(page)
          await wait(2000)

          evaluatePromise.then((rect) => {
            const clipRect = this.defaultClipRect.merge({
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            })
            page.property('clipRect', clipRect)

            page.render(filename).then(() => resolve(filename)).catch(e => { throw e })
          })
        })
      } catch (e) { reject(e) }
    })

    return saveImagePromise
  }
}
