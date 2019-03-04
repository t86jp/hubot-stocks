import R from 'ramda'

const moji = require('moji')

export const STOCK_NUMBER_REGEX = /(?<![0-9０-９])([0-9０-９]{4})(?![0-9０-９])/g

export function * findStockNumber (message) {
  let _message = message
  const noise = (matcher) => {
    _message = _message.replace(matcher, '')
  }

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

export const normalizeStockNumber = (stockNumber) => {
  return moji(stockNumber).convert('ZE', 'HE').toString()
}
