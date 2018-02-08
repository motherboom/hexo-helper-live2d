/**
 * @description The live2d-widget generator for hexo
 */


'use strict'

const fs = require('hexo-fs'),
      path = require('path'),
      url = require('url'),
      _ = require('lodash'),
      localJsPath = '/live2d/lib/',
      coreJsList = require('live2d-widget/lib/manifest'),
      defaultConfig = require('live2d-widget/src/config/defaultConfig');

let fileArr = new Array(),
    modelPath,
    jsPath,
    modelJsonPath,
    config = _.defaultsDeep(hexo.config.live2d, hexo.theme.config.live2d, defaultConfig);

function getModelJson(pathName){
  var fileName = path.parse(pathName).name.split('.');
  if(fileName[1] === 'model'){
      modelJsonPath = pathName;
  }
}

function addFile(destPath, sourceFile){
  fileArr.push({
    path: destPath,
    data: () => fs.createReadStream(sourceFile),
  });
}

function addDir(destPath, sourceDir) {
  let lsDir = fs.readdirSync(sourceDir)
  lsDir.forEach(function (file) {
    addFile(destPath + file, path.resolve(sourceDir, file));
  }, this);
}

// Check if enabled
if(_.hasIn(config, 'enable')){
  if(!config.enable){
    return;
  }
  _.unset(config, 'enable');
}

// Preprocess jsPath for injecting and file copying
// Copy file and apply real_jsPath only if jsPath === jsOnLocalPath
if(_.hasIn(config, 'jsPath')){
  switch(config.jsPath){
    case 'local':
      jsPath = jsOnLocalPath;
      break;
    case 'jsdelivr':
      jsPath = 'https://cdn.jsdelivr.net/npm/live2d-widget@3.x/lib/clL2D.min.js';
      break;
    case 'unpkg':
      jsPath = 'https://unpkg.com/live2d-widget@3.x/lib/clL2D.min.js';
      break;
    default:
      jsPath = config.jsPath;
  }
  _.unset(config, 'jsPath');
}else{
  jsPath = jsOnLocalPath;
}

// Preprocess modelPath for injecting and file copying
// 1. Unset model.jsonPath
if(_.hasIn(config, 'model.jsonPath')){
  _.unset(config, 'model.jsonPath');
}
// 2. Process config.model.use
// Set modelPath and config.model.use in some case
// Copy file and apply config.model.jsonPath only if !_.hasIn(config, 'model.jsonPath')
if(_.hasIn(config, 'model.use')){
  // 2.a is a npm-module
  try(){
    modelPath = require.resolve(config.model.use);
  }catch(e){
    // 2.b is in live2d_models/ folder
    let tryPath = path.resolve(hexo.base_dir, path.join('./live2d_models/', config.model.use));
    fs.exists(tryPath, function(exists){
      if(exists){
        // 2.b continue
      }else{
        // 2.c maybe an url or something, just apply it.
        // 3.c Apply config.model.jsonPath
        config.model.jsonPath = config.model.use;
      }
    })
  }


  _.unset(config, 'model.use');
}else{
  // 2.d doesn't have config.model.use use default
  // 3.d Apply config.model.jsonPath
  config.model.jsonPath = defaultConfig.model.jsonPath;
}

// Process config.model.jsonPath
// and copy files
if(!_.hasIn(config, 'model.jsonPath')){

}


// Process jsPath with real_jsPath(not a varible)
// and copy files
if(jsPath === jsOnLocalPath){
  // a. is local
  // copy coreJs

  // apply jsPath

}else{
  // b. is a CDN or url, let it go ~
}


/**
 * Deprecated version support
 * since 3.0
 * Don't manually add live2d tag into your site template
 */

hexo.extend.helper.register('live2d', function(){
  console.warn('hexo-helper-live2d: live2d tag was deprecated since 3.0. See #36. PLEASE REMOVE live2d TAG IN YOUR TEMPLATE FILE.');
});

// injector borrowed form here:
// https://github.com/Troy-Yang/hexo-lazyload-image/blob/master/lib/addscripts.js
hexo.extend.filter.register('after_render:html', function(htmlContent){
  let launcherScript = `L2Dwidget.init(${JSON.stringify(config)});`;
  let injectExtraScript = `<script src="${jsPath}"></script><script>${launcherScript}</script>`
  if(/<\/body>/gi.test(htmlContent)){
    let lastIndex = htmlContent.lastIndexOf('</body>');
    htmlContent = htmlContent.substring(0, lastIndex) + injectExtraScript + htmlContent.substring(lastIndex, htmlContent.length);
  }
  return htmlContent;
});
