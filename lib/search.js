"use strict";


const cheerio = require('cheerio');
const request = require('request');
const chalk = require('chalk');

const readline = require('readline');

let next_url = [];




class Search {
    constructor(flags) {
        this.flags = flags;
        this.base_url = 'http://www.dysfz.vip/key/';
        this.pageNum = 1;
        this.headers = {
            //'Referer': 'http://www.dysfz.vip/',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.84 Safari/537.36'
        }
    }
    callback(err, response, body) {
        if (!err && (response.statusCode >= 200 && response.statusCode < 300)) {
            return body;
        }
    }
    asyncReq(URL) {
        return new Promise((resolve, reject) => {
            request({ url: URL }, (err, response, body) => {
                if (!err && (response.statusCode >= 200 && response.statusCode < 300)) {
                    resolve(body);
                } else {
                    reject(err);
                }
            });
        });
    }
    searchForNext(url, pageNum) {
        let allurl = [url];
        if (pageNum > 1) {
            for (let i = 2; i < pageNum; i++) {
                let url = encodeURI(this.base_url + this.flags.name + '/') + i + '?o=2';
                allurl.push(url);
            }
        }
        return allurl;

    }
    searchFor(url) {
        return new Promise((resolve, reject) => {
            url = encodeURI(url);
            console.log('这里可能要等待较长时间，若长时间无响应，请键入ctrl+c关闭重试');
            this.asyncReq(url).then(res => {

                let $ = cheerio.load(res);
                let pageNum = $('.pageturn div a') ? $('.pageturn div a').length : 1;
                let allUrl = this.searchForNext(url, pageNum);
                allUrl.push(url);
                console.log('\n 资源总页数:', pageNum + 1);
                return allUrl
            }).then(res => {
                let result = [];
                let promise = res.map(item => {
                    return this.asyncReq(item).then(res => {
                        let $ = cheerio.load(res);
                        let a = $('.movie-list li h2 a');
                        for (let i = 0; i < a.length; i++) {
                            let item = {
                                "title": $(a[i]).text(),
                                "href": $(a[i]).attr('href')
                            }
                            result.push(item);
                        }
                    });
                });
                return Promise.all(promise).then(() => {
                    return result;
                }).catch(err => {
                    throw Error('系统出错');
                });
            }).then(res => {
                resolve(res);
            }).catch(err => {
                console.log(chalk.bold.red('系统出错'));
                console.log(err);
            });
        });
    }
    searchItem() {
        return new Promise((resolve, reject) => {
            if (this.flags.name) {
                let url = this.base_url + this.flags.name + '/';
                this.searchFor(url).then(res => {
                    resolve(res);
                });
            } else {
                reject();
            }
        });
    }
}

module.exports = Search;