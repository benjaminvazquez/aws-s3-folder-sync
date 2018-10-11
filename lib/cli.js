#!/usr/bin/env node
var program = require('commander');
var syncs3 = require('./sync-folder');

program
.arguments('<bucketName>')
.option('-p, --prefix <value>','The folder structure. default: empty')
.option('-f, --folder <path>','The directory to sync. default: current directory')
.option('-e, --excluded-extensions <value>', 'To exclude default extensions. default:empty', list)
.option('-i, --included-extensions <value>', 'The additional included extensions. default: .jpg,.jpeg,.mp4,.png', list)
.option('-a, --all-files', 'This flag overrides the excluded and included extensions, and upload all the files in folder. default: false')

.action(async function(bucketName){
    let directory = program.folder || process.cwd();
    console.time('Elapsed milliseconds: ');
    let options = {
        directory: directory,
        prefix: program.prefix,
        bucketName: bucketName,
        excludedExtensions: program.excludedExtensions || [],
        includedExtensions: program.includedExtensions || [],
        allFiles: program.allFiles || false
    };
    console.log(options);
    await syncs3(options);
    console.timeEnd('Elapsed milliseconds: ');
}).parse(process.argv);

function list(val) {
    return val.split(',');
}