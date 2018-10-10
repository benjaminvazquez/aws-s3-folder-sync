#!/usr/bin/env node
 var program = require('commander');
 var syncs3 = require('./sync-folder');

 program
 .arguments('<bucketName>')
 .option('-p, --prefix <prefix>','The folder structure')
 .option('-f, --folder <folder>','The directory to sync')

 .action(async function(bucketName){
    let directory = program.folder || process.cwd();
    console.log('Bucket: %s', bucketName);
    console.log('Prefix: %s', program.prefix);
    console.log('Directory: %s', directory);
    console.time('Elapsed milliseconds: ');
    let options = {
        directory: directory,
        prefix: program.prefix,
        bucketName: bucketName
    };
    await syncs3(options);
    console.timeEnd('Elapsed milliseconds: ');
 }).parse(process.argv);