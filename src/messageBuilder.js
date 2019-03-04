export function createLink (text, url) {
  return {
    'type': 'button',
    text,
    url
  }
}
export function createExternalLinks (code) {
  const actions = []

  actions.push(createLink('株探', `https://kabutan.jp/stock/chart?code=${code}`))
  actions.push(createLink('株ライン', `https://kabuline.com/stock/code/${code}/`))
  // return createLink('https://kabutan.jp/favicon.ico', 'https://kabutan.jp/stock/chart?code=' + code)

  return {
    text: `外部リンク ${code}`,
    attachments: [{
      fallback: 'links: ' + actions.map((a) => `<${a.url}|${a.text}>`).join(' '),
      actions
    }]
  }
}
