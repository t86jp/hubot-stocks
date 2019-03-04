import { saveChartImage, uploadChartImage } from './chart'
import { STOCK_NUMBER_REGEX, findStockNumber } from './textParser'
import { createExternalLinks } from './messageBuilder'

require('dotenv').config()

module.exports = (robot) => {
  robot.hear(STOCK_NUMBER_REGEX, async (message) => {
    const channel = message.envelope.room == 'Shell' ? '株bot-test' : message.envelope.room
    const sendLinks = (code) => message.send(createExternalLinks(code))

    for (let code of findStockNumber(message.message.text)) {
      try {
        saveChartImage(code)
          .then(async (filename) => {
            let stdout = await uploadChartImage(code, filename, channel)
            sendLinks(code)
          })
      } catch (e) {
        message.send(`error stock=${code}: チャートerror: ${e}`)
        sendLinks(code)
      }
    }
  })
}
