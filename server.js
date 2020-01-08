require('events').EventEmitter.prototype._maxListeners = 0;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const CORS = require('cors');
//PUPPETEER 🐱‍💻
const puppeteer = require('puppeteer');
//BULL & THRONG 🐂
let Queue = require("bull");
let throng = require('throng');
//MIDDLEWARE
app.use(bodyParser.json());
app.use(CORS());

//START SERVER
const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
    console.log(`***Server is listening on ${PORT}***`);
});

//WEB PROCESS
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let workQueue = new Queue('work', REDIS_URL);

//WORKERS
let workers = process.env.WEB_CONCURRENCY || 2;

//HEADLESS CHROME
(async () => {
    //INIT PUPPETEER
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const celebComedianList = 'https://en.wikipedia.org/wiki/List_of_comedians' 

    //GET CELEB COMEDIAN NAMES PAGE
    await page.goto(celebComedianList);
    const names = await page.evaluate(
        () => Array.from(document.querySelectorAll('div ul li a[title]'))
        .map(element => element.textContent.split(' ').join('_'))
    );

    //ASYNC MAP ALL CELEB INFO BY NAME
    let results = names.slice(0, 100).map(async (name) => { 
        const page = await browser.newPage();
        await page.goto(`https://en.wikipedia.org/api/rest_v1/page/html/${name}?redirect=false`)
        const data = await page.evaluate(
            () => document.querySelector('span .bday') ? 
                document.querySelector('span .bday').textContent : 
                null
        )
        const death = await page.evaluate(
            () => Array.from(document.querySelectorAll('body section table tbody tr th'))
                .find(th => th.textContent.includes('Died'))
        )
        return ({name:name, born: data, died: death})
    })

    //!ENDPOINTS
    /* GET: COMEDIAN CELEBS */
    app.get('/comedians', (req, res) => {
        //console.log(names)
        res.send(names)
    });

    /* GET: CELEB BIRTH DATA BY NAME (?NAME=) */
    app.get('/byname', async (req, res) => {
        //console.log(`https://en.wikipedia.org/api/rest_v1/page/html/${req.query.name}?redirect=false`);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`https://en.wikipedia.org/api/rest_v1/page/html/${req.query.name}?redirect=false`)
        const data = await page.evaluate(
            () => document.querySelector('span .bday').textContent
        )
        //console.log(data)
        res.send(data)

    });

    /* GET: ALL CELEB DATA */
    app.get('/all', async (req, res) => {
        //console.log(celebData)
        //ADD PROMISE TO QUE
        let job = await workQueue.add({data: results})
        //START PROCESS
        workQueue.process(function(job) {
            return Promise.all(job)
        })
        //RETURN DATA ON COMPLETION
        workQueue.on('completed', (job, data) => {
        console.log(`Job completed with result ${data}`);
        res.send({data: data})
        })
    })
})();