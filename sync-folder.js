'use strict'

var fs = require('fs');
var aws = require('aws-sdk');
var path = require('path');
var Counters = require('./counters');

async function syncFolder(options){
    let counters = new Counters();
    let knownExtensions = ['.jpg','.jpeg','.mp4','.png'];
    var prefix = options.prefix || undefined;
    var s3 = createS3Manager(options.bucketName);

    try{
        let files = readDirectory(options.directory);
        await processFiles(files);
    }catch(error){
        console.error('Process error: %s', error);
    }

    async function processFiles(files){
        let filesCount = files.length;
        console.log('%d objects found', filesCount);
        for(var i = 0; i < filesCount; i++){
            try{
                var currentFile = files[i];
                let stats = readFileStats(options.directory, currentFile);
                if(shouldBeProcessed(stats, currentFile)){
                    await pushObject(currentFile, i, stats.size );
                }
            }catch(err){
                counters.error(err);
            }
        }
        counters.print();
    }

    function shouldBeProcessed(fileStats, currentFile){
        let result = false;
        if(fileStats.isFile()){
            let fileExtension = path.extname(currentFile);
            if(knownExtensions.find(x => x === fileExtension) != undefined){
                result = true;
            }else{
                counters.skip('------------Skip file extension %s', currentFile);
            }
        }else{
            counters.skip('------------Skip directory %s', currentFile);
        }

        return result;
    }

    function pushObject(currentFile, index, size){
        let fileKey = encodeURIComponent(currentFile);
        if(prefix) fileKey = encodeURIComponent(prefix)+'/'+fileKey;
        return s3.headObject({Key:fileKey}).promise().then(
            function(data){
                counters.skip('%d %s--> already exists', index, currentFile);
                return;
            },
            function(err){
                if(err.code !== 'NotFound'){
                    counters.error('%d %s--> error reading aws metadata. %s',index, currentFile, err);
                    return;
                }
                console.log('%f %s--> ready to upload %s',index, currentFile, formatBytes(size));
                let fileToRead = options.directory+'\\'+currentFile;
                let fileReaded = fs.readFileSync(fileToRead);

                return s3.putObject({Key:fileKey, Body: fileReaded}).promise().then(
                    function (data){
                        counters.success('%d %s--> file uploaded', index, currentFile);
                    },
                    function(err){
                        counters.error('%d %s--> error uploading. %s', index, currentFile, err);
                    }
                );
            }
        );
    }
}

function readDirectory(directory){
    let files;
    try{
        files = fs.readdirSync(directory);
    }catch(err){
        throw 'An error ocurred trying to read the directory: ' + err;
    }

    return files;
}

function readFileStats(directory, currentFile){
    let stats = undefined;
    try{
        stats = fs.statSync(directory+'\\'+currentFile);
    }catch(err){
        throw currentFile+"--> Cannot read file stats. "+err;
    }

    return stats;
}

function formatBytes(a,b){
    if(0==a)return"0 Bytes";
    var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));
    return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
}

function createS3Manager(bucketName){
    var manager =  new aws.S3({
        params: {Bucket: bucketName}
    });

    return manager;
}

module.exports = syncFolder;