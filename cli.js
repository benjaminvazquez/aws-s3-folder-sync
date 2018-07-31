#!/usr/bin/env node
 var program = require('commander');
 var syncs3 = require('./sync-folder');
 console.log(process.cwd());

 program
 .arguments('<bucketName>')
 .option('-p, --prefix <prefix>','The folder structure')
 .option('-d, --dir <directory>','The directory to sync')
 .action(function(bucketName){
     var directory = program.directory || process.cwd();
    syncs3(directory, program.prefix, bucketName);
 }).parse(process.argv);