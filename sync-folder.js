'use strict';

var fs = require('fs');
var aws = require('aws-sdk');

function syncFolder(currentDir, subfolder, bucketName){
    var successCount = 0;
    var skipCount = 0;
    var errorCount = 0;
    var prefix = subfolder || undefined;
    var files = [];
    var s3 = createS3Manager(bucketName);

    console.log('Reading path: %s', currentDir);

    readDirectoryFiles();
    processFiles(files);

    function readDirectoryFiles(){
        try{
            files = fs.readdirSync(currentDir);
        }catch(err){
            console.error('An error ocurred trying to read the directory');
            console.error('%s', err);
        }
    }

    async function processFiles(files){

        var filesCount = files.length;
        console.log('%d objects found', filesCount);

        for (var i = 0; i < filesCount; i++){
            let currentFile = files[i];

            try{
                let stats = fs.statSync(currentDir+'\\'+currentFile);

                // Check isFile flag to process or skip the object
                if(stats.isFile()){
                    await pushObject(currentFile, i, stats.size );
                }else{
                    skipCount++;
                    console.log('------------Skip directory %s', currentFile);
                }
            }catch(err){
                errorCount++;
                console.error('%s --> Cannot read stats. %s', currentFile, err);
            }
        }
        
        console.log('Error: %d, Success: %d, Skiped: %d', errorCount, successCount, skipCount);
    }

    function pushObject(currentFile, index, size){
        let fileKey = encodeURIComponent(currentFile);

        if(prefix) fileKey = encodeURIComponent(prefix) + '/' + fileKey;

        return s3.headObject({Key:fileKey}).promise().then(
            function(data){
                skipCount++;
                console.log('%d %s--> already exists', index, currentFile);
                return;
            },
            function(err){
                if(err.code !== 'NotFound'){
                    errorCount++;
                    console.log('%d %s--> error reading metadata. %s',index, currentFile, err);
                    return;
                }
                console.log('%f %s--> ready to upload %s',index, currentFile, formatBytes(size));
                let fileToRead = currentDir+'\\'+currentFile;
                let fileReaded = fs.readFileSync(fileToRead);

                return s3.putObject({Key:fileKey, Body: fileReaded}).promise().then(
                    function (data){
                            successCount++;
                            console.log('%d %s--> file uploaded', index, currentFile);
                    },
                    function(err){
                        errorCount++;
                        console.log('%d %s--> error uploading. %s', index, currentFile, err);
                    }
                );
            }
        );
    }

    function createS3Manager(bucket){
        var manager =  new aws.S3({
            params: {Bucket: bucket}
        });

        return manager;
    }

    function formatBytes(a,b){
        if(0==a)return"0 Bytes";
        var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));
        return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
    }
}



module.exports = syncFolder;