import fs from 'fs';
import path from 'path';
import mustache from 'mustache';
import minifier from 'html-minifier';
import marked from 'marked';
import hjs from 'highlight.js';

const lineBreak = '\n';

const paths = {
  readme: path.join(__dirname, '../README.md'),
  template: path.join(__dirname, 'templates/index.html'),
  destination: path.join(__dirname, '../dist/index.html')
};

const minifierSettings = {
  collapseWhitespace: true
};

marked.setOptions({
  highlight: code => hjs.highlightAuto(code).value
});

let readme = fs.readFileSync(paths.readme).toString();
let content = marked(readme);

// Write index.
fs.writeFileSync(paths.destination, minifier.minify(
  mustache.render(fs.readFileSync(paths.template).toString(), {
    content
  }), minifierSettings));
