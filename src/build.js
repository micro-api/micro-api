import fs from 'fs';
import path from 'path';
import mustache from 'mustache';
import minifier from 'html-minifier';
import marked from 'marked';
import hjs from 'highlight.js';

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

marked.setOptions({
  highlight: code => hjs.highlightAuto(code).value
});

let readme = fs.readFileSync(paths.readme).toString();

readme = readme.split(lineBreak).map((line, number) => number === 0 ?
  firstLine : line).join(lineBreak);

let content = marked(readme);

// Write index.
fs.writeFileSync(paths.destination, minifier.minify(
  mustache.render(fs.readFileSync(paths.template).toString(), {
    content, pkg
  }), minifierSettings));
