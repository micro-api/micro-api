'use strict'

const fs = require('fs')
const path = require('path')
const mustache = require('mustache')
const minifier = require('html-minifier')
const marked = require('marked')
const hjs = require('highlight.js')
const jsdom = require('jsdom')
const yaml = require('js-yaml')
const chalk = require('chalk')


marked.setOptions({
  highlight: code => hjs.highlightAuto(code).value
})


const renderer = new marked.Renderer()

const lineBreak = '\n'
const name = 'Micro API'
const markdownExtension = '.md'
const htmlExtension = '.html'
const yamlExtension = '.yaml'
const index = `index${htmlExtension}`
const firstLine = '[![Micro API](./assets/logo_light.svg)]' +
  '(https://github.com/micro-api/micro-api)'
const documentComment = [ `<!--`,
  `This page is automatically generated from a build script.`,
  `https://github.com/micro-api/micro-api`,
  `-->` ].join(lineBreak)


const from = str => path.join(__dirname, str)
const pkg = JSON.parse(fs.readFileSync(
  from('../package.json')).toString())

const paths = {
  readme: from(`../README${markdownExtension}`),
  vocabulary: from('../vocabulary/'),
  template: from('templates/'),
  destination: from('../dist/')
}

const minifierSettings = {
  collapseWhitespace: true
}

const readme = fs.readFileSync(paths.readme).toString()
  .split(lineBreak).map((line, number) => number === 0 ?
    firstLine : line).join(lineBreak)

const vocabulary = fs.readdirSync(paths.vocabulary)
  .reduce((object, filename) => {
    const term = path.basename(filename, yamlExtension)

    object[term] = yaml.load(
      fs.readFileSync(path.join(paths.vocabulary, filename)).toString())

    if ('description' in object[term]) {
      const value = object[term].description
      object[term].description = marked(value, { renderer })
    }

    return object
  }, {})


renderer.heading = (text, level) => {
  let escapedText = text.toLowerCase().replace(/[^\w]+/g, '-')

  return `<h${level} id="${escapedText}">${text} <a class="anchor" ` +
    `href="#${escapedText}" title="Link to this section “${text}”">#</a>` +
    `</h${level}>`
}


let menu


Promise.resolve()

.then(() => new Promise(resolve =>
  jsdom.env(marked(readme, { renderer }), (errors, window) => {
    const document = window.document

    document.querySelector('p:first-of-type').className = 'header'

    const pre = Array.from(document.querySelectorAll('pre'))

    pre.map(node => {
      const prev = node.previousSibling.previousSibling.nodeName
      const next = node.nextSibling.nextSibling.nodeName
      const names = new Set([ prev, next ])

      if (names.has('PRE')) node.className += 'group'

      return node
    })

    const headers = Array.from(document.querySelectorAll('h1, h2, h3'))

    menu = '<ul>' + headers.map(node =>
      '<li><a href="#' + node.children[0].href.split('#')[1] + '">' +
        node.textContent.slice(0, -2) + '</a></li>').join('') + '</ul>'

    return resolve(window.document.body.innerHTML)
  })))

.then(content => {
  fs.writeFileSync(
    path.join(paths.destination, index),
    minifier.minify(mustache.render(
      fs.readFileSync(path.join(paths.template, index)).toString(),
      { name, content, menu, pkg, documentComment }), minifierSettings))

  for (let term in vocabulary)
    fs.writeFileSync(
      path.join(paths.destination, `${term}${htmlExtension}`),
      minifier.minify(mustache.render(fs.readFileSync(
          path.join(paths.template, `vocabulary${htmlExtension}`)).toString(),
          Object.assign({ term, name, documentComment }, vocabulary[term])),
          minifierSettings))
})

.catch(error => {
  process.stderr.write(chalk.red(error.stack))
  process.exit(1)
})
