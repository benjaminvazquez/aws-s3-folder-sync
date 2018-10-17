'use strict'

var fs = require('fs');
var aws = require('aws-sdk');
var path = require('path');
var Counters = require('./counters');

async function syncFolder(options){
    let counters = new Counters();
    let knownExtensions = ['.jpg','.jpeg','.mp4','.png', ...options.includedExtensions];
    var prefix = options.prefix || undefined;
    var s3 = createS3Manager(options.bucketName);

    try{
        let files = readDirectory(options.directory);
        await processFiles(files);
        counters.print();
    }catch(error){
        console.error(`Process error: ${error}`);
    }

    /**
     * @param {Array} files
     */
    async function processFiles(files){
        let filesCount = files.length;
        console.log(`${filesCount} objects found`);
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
    }

    /**
     *
     * @param {Stats} fileStats
     * @param {string} currentFile
     */
    function shouldBeProcessed(fileStats, currentFile){
        let result = false;
        if(fileStats.isFile()){
            if(options.allFiles || isValidExtension(currentFile)){
                result = true;
            }else{
                counters.skip(`------------Skip file extension ${currentFile}`);
            }
        }else{
            counters.skip(`------------Skip directory ${currentFile}`);
        }

        return result;
    }

    function isValidExtension(currentFile){
        let fileExtension = path.extname(currentFile);
        if(options.excludedExtensions.find(x => x === fileExtension) != undefined)
            return false;
        if(knownExtensions.find(x => x === fileExtension) != undefined)
            return true;

        return false;
    }

    function pushObject(currentFile, index, size){
        let fileKey = encodeURIComponent(currentFile);
        if(prefix) fileKey = encodeURIComponent(prefix)+'/'+fileKey;
        return s3.headObject({Key:fileKey}).promise().then(
            function(){
                counters.skip(`${index} ${currentFile}--> already exists`);
                return;
            },
            function(err){
                if(err.code !== 'NotFound'){
                    counters.error(`${index} ${currentFile}--> error reading aws metadata. ${err}`);
                    return;
                }
                console.log(`${index} ${currentFile}--> ready to upload ${formatBytes(size)}`);
                let fileToRead = options.directory+'\\'+currentFile;
                let fileRead = fs.readFileSync(fileToRead);

                return s3.putObject({Key:fileKey, Body: fileRead}).promise().then(
                    function (){
                        counters.success(`${index} ${currentFile}--> file uploaded`);
                    },
                    function(err){
                        counters.error(`${index} ${currentFile}--> error uploading. ${err}`);
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
        throw `An error ocurred trying to read the directory: ${err}`;
    }

    return files;
}

function readFileStats(directory, currentFile){
    let stats = undefined;
    try{
        stats = fs.statSync(directory+'\\'+currentFile);
    }catch(err){
        throw `${currentFile}--> Cannot read file stats. ${err}`;
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