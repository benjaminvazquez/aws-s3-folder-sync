'use strict'

function Counters(){
    this.successCount = 0;
    this.skipCount = 0;
    this.errorCount = 0;

    this.success = function success(format, ...args){
        this.successCount++;
        console.log(format, ...args);
    }

    this.skip = function skip(format, ...args){
        this.skipCount++;
        console.log(format, ...args);
    }

    this.error = function error(format, ...args){
        this.errorCount++;
        console.log(format, ...args);
    }

    this.print = function print(){
        console.log(`Error: ${this.errorCount}, Success: ${this.successCount}, Skipped: ${this.skipCount}`);
    }
}

module.exports = Counters;