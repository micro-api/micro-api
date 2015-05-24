import fs from 'fs'
import path from 'path'
import mustache from 'mustache'
import minifier from 'html-minifier'
import marked from 'marked'
import hjs from 'highlight.js'
import jsdom from 'jsdom'


const renderer = new marked.Renderer()

const lineBreak = '\n'
const firstLine = '[![Micro API](./assets/logo_light.svg)]' +
  '(https://github.com/micro-api/micro-api)'

const from = str => path.join(__dirname, str)
const pkg = JSON.parse(fs.readFileSync(
  from('../package.json')).toString())

const paths = {
  readme: from('../README.md'),
  template: from('templates/index.html'),
  destination: from('../dist/index.html')
}

const minifierSettings = {
  collapseWhitespace: true
}

const readme = fs.readFileSync(paths.readme).toString()
  .split(lineBreak).map((line, number) => number === 0 ?
    firstLine : line).join(lineBreak)


renderer.heading = (text, level) => {
  let escapedText = text.toLowerCase().replace(/[^\w]+/g, '-')

  return `<h${level} id="${escapedText}">${text} <a class="anchor" ` +
    `href="#${escapedText}" title="Link to this section “${text}”">#</a>` +
    `</h${level}>`
}


marked.setOptions({
  highlight: code => hjs.highlightAuto(code).value
})


let menu


new Promise(resolve =>
  jsdom.env(marked(readme, { renderer }), (errors, window) => {
    const { document } = window

    document.querySelector('p:first-of-type').className = 'header'

    const pre = [ ...document.querySelectorAll('pre') ]

    pre.map(node => {
      const { previousSibling } = node.previousSibling
      const { nextSibling } = node.nextSibling
      const names = new Set([ previousSibling.nodeName, nextSibling.nodeName ])

      if (names.has('PRE'))
        node.className += 'group'

      return node
    })

    const headers = [ ...document.querySelectorAll('h1, h2, h3') ]

    menu = '<ul>' + headers.map(node =>
      '<li><a href="#' + node.children[0].href.split('#')[1] + '">' +
        node.textContent.slice(0, -2) + '</a></li>').join('') + '</ul>'

    return resolve(window.document.body.innerHTML)
  }))

.then(content => {
  fs.writeFileSync(paths.destination, minifier.minify(
  mustache.render(fs.readFileSync(paths.template).toString(), {
    content, menu, pkg
  }), minifierSettings))
})
