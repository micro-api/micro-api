import fs from 'fs';
import path from 'path';
import mustache from 'mustache';
import minifier from 'html-minifier';
import marked from 'marked';
import hjs from 'highlight.js';
import jsdom from 'jsdom';


marked.setOptions({
  highlight: code => hjs.highlightAuto(code).value
});

const lineBreak = '\n';
const firstLine = '[![Micro API](./assets/logo_light.svg)]' +
  '(https://github.com/micro-api/micro-api)';

const from = str => path.join(__dirname, str);
const pkg = JSON.parse(fs.readFileSync(
  from('../package.json')).toString());

const paths = {
  readme: from('../README.md'),
  template: from('templates/index.html'),
  destination: from('../dist/index.html')
};

const minifierSettings = {
  collapseWhitespace: true
};

const readme = fs.readFileSync(paths.readme).toString()
  .split(lineBreak).map((line, number) => number === 0 ?
    firstLine : line).join(lineBreak);

new Promise(resolve => jsdom.env(marked(readme), (errors, window) => {
  [...window.document.querySelectorAll('pre')].map(node => {
    let previousName = node.previousSibling.nodeName;
    let nextName = node.nextSibling.nodeName;

    if (~[previousName, nextName].indexOf('PRE')) {
      node.className += 'group';
    }

    return node;
  });

  return resolve(window.document.body.innerHTML);
})).then(content => {
  fs.writeFileSync(paths.destination, minifier.minify(
  mustache.render(fs.readFileSync(paths.template).toString(), {
    content, pkg
  }), minifierSettings));
});
