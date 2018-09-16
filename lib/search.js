"use strict";


const cheerio = require('cheerio');
const request = require('request');

const readline = require('readline');

let next_url = [];

// const headers = {
//     'Referer': 'http://www.dysfz.cc/',
//     'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.84 Safari/537.36'
// }


class Search {
    constructor(flags) {
        this.flags = flags;
        this.base_url = 'http://www.dysfz.cc/key/';
        this.pageNum = 1;
        this.headers = {
            //'Referer': 'http://www.dysfz.cc/',
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
            request({ url: URL, headers: this.headers }, (err, response, body) => {
                if (!err && (response.statusCode >= 200 && response.statusCode < 300)) {
                    resolve(body);
                } else {
                    reject(err);
                }
            });
        });
    }
    searchForNext(pageNum) {
        let allurl = [];
        for (let i = 2; i < pageNum; i++) {
            let url = encodeURI(this.base_url + this.flags.name + '/') + i + '?o=2';
            allurl.push(url);
        }
        return allurl;

    }
    searchFor(url) {
        return new Promise((resolve, reject) => {
            url = encodeURI(url);
            let _this = this;
            async function wait() {
                let body = await _this.asyncReq(url);
                let $ = cheerio.load(body);
                let pagination = $('.pageturn');
                let pageNum = $('.pageturn div a').length;
                let allurl = _this.searchForNext(pageNum);
                allurl.push(url)
                console.log('资源总页数:', allurl.length)
                console.log('这里可能要等待较长时间，若长时间无响应，请键入ctrl+c关闭重试')
                let result = [];
                for (let url of allurl) {
                    let body = await _this.asyncReq(url);
                    let $ = cheerio.load(body);
                    let a = $('.movie-list li h2 a');

                    for (let i = 0; i < a.length; i++) {
                        let item = {
                            "title": $(a[i]).text(),
                            "href": $(a[i]).attr('href')
                        }
                        result.push(item);
                    }
                }
                let jsonData = JSON.stringify({ html: result });
                resolve(jsonData);
            }
            console.log('请稍等...');
            wait();
        });
    }
    searchItem() {
        return new Promise((resolve, reject) => {
            if (this.flags.name) {
                let url = this.base_url + this.flags.name + '/';
                let source = this.searchFor(url);
                resolve(source);
            }
        })
    }
}

module.exports = Search;