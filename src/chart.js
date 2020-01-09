import Kabutan from './kabutan'
const childProcess = require('child_process')

const CHART_DIR = './tmp'

function saveChartImage (stockNumber) {
  const filename = `${CHART_DIR}/${stockNumber}.png`

  let kabutan = new Kabutan()
  return kabutan.saveChartImage(stockNumber, filename, (page) => {
    return page.evaluate(function () {
      document.getElementById('kc_ashi_4').click()
      document.getElementById('kc_tech2_11').click()

      const rect = document.getElementById('kc_backPanel_c0').getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      }
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

export {
  saveChartImage,
  uploadChartImage
}
