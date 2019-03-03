import Kabutan from './kabutan'
const childProcess = require('child_process')
const moji = require('moji')
require('dotenv').config()

const CHART_DIR = './tmp'
const STOCK_NUMBER_REGEX = /([0-9０-９]{4})/g

const normalizeStockNumber = (stockNumber) => {
  return moji(stockNumber).convert('ZE', 'HE').toString()
}
function saveChartImage (stockNumber) {
  const filename = `${CHART_DIR}/${stockNumber}.png`

  return new Promise((resolve, reject) => {
    let kabutan = new Kabutan()
    kabutan.openPageByCode(stockNumber, async (page) => {
      let rect = await page.evaluate(function () {
        document.getElementById('kc_ashi_4').click()
        document.getElementById('kc_tech2_11').click()

        return document.getElementById('kc_area').getBoundingClientRect()
      })

      kabutan.clipRect({
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      })

      await page.render(filename)

      resolve(filename)
    })
  })
}
async function uploadChartImage (stockNumber, filename, channel) {
  const command = `curl -F "filename=${stockNumber}.png" -F "file=@${filename}" -F "channels=${channel}" -F "token=${process.env.HUBOT_SLACK_TOKEN}" https://slack.com/api/files.upload && rm -f ${filename}`
  let _stdout

  childProcess.execSync(command, (error, stdout, stderr) => {
    if (error) {
      throw new Error(stderr)
    }
    _stdout = stdout
  })
  return _stdout
}

module.exports = (robot) => {
  robot.hear(STOCK_NUMBER_REGEX, async (message) => {
    const channel = message.envelope.room == 'Shell' ? '株bot-test' : message.envelope.room

    message.match.forEach((number) => {
      let code = normalizeStockNumber(number)

      try {
        saveChartImage(code)
          .then(async (filename) => {
            let stdout = await uploadChartImage(code, filename, channel)
            // message.send('ga: ' + filename)
          })
      } catch (e) {
        message.send(`error stock=${code}: チャートerror: ${e}`)
      }
    })
  })
}
