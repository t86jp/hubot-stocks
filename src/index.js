import Kabutan from './kabutan'
import R from 'ramda'
const childProcess = require('child_process')
const moji = require('moji')
require('dotenv').config()

const CHART_DIR = './tmp'
const STOCK_NUMBER_REGEX = /([0-9０-９]{4})/g

function * findStockNumber (message) {
  let _message = message
  const noise = (matcher) => _message = _message.replace(matcher, '')

  // March 04, 2019
  noise(/(?:Jan(?:uary|\.)|Feb(?:ruary|\.)|Mar(?:ch|\.)|Apr(?:il|\.)|May|Jun(?:e|\.)|Jul(?:y|\.)|Aug(?:ust|\.)|Sep(?:tember|\.)|Oct(?:ober|\.)|Nov(?:ember|\.)|Dec(?:ember|\.))\s+[0-3][0-9],\s+20[0-9][0-9]/gi)
  // at 10:16AM
  noise(/\s+at\s*[0-9]{2}:[0-9]{2}(?:am|pm)?/gi)
  // url
  noise(/https?:\/\/[^ ]+/g)
  // xxxx円
  noise(/[0-9０-９]+円/g)

  let matches = (_message.match(STOCK_NUMBER_REGEX) || []).map((number) => normalizeStockNumber(number))
  for (let number of R.uniqWith(R.eqBy(String))(matches)) {
    yield number
  }
}
const normalizeStockNumber = (stockNumber) => {
  return moji(stockNumber).convert('ZE', 'HE').toString()
}
function saveChartImage (stockNumber) {
  const filename = `${CHART_DIR}/${stockNumber}.png`

  return new Promise((resolve, reject) => {
    let kabutan = new Kabutan()
    kabutan.openPageByCode(stockNumber, (page) => {
      let callbackPromise = new Promise((callbackResolve, callbackReject) => {
        let interval = setTimeout(() => {
          page.evaluate(function () {
            document.getElementById('kc_ashi_4').click()
            document.getElementById('kc_tech2_11').click()

            return document.getElementById('kc_area').getBoundingClientRect()
          }).then((rect) => {
            kabutan.clipRect({
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            })

            page.render(filename).then(() => callbackResolve(filename))
          }).catch((e) => callbackReject(e))
        }, 500)
      })

      return callbackPromise.then(() => resolve(filename)).catch((e) => reject(e))
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

    for (let code of findStockNumber(message.message.text)) {
      try {
        saveChartImage(code)
          .then(async (filename) => {
            let stdout = await uploadChartImage(code, filename, channel)
            // message.send('ga: ' + filename)
          })
      } catch (e) {
        message.send(`error stock=${code}: チャートerror: ${e}`)
      }
    }
  })
}
