require('events').EventEmitter.prototype._maxListeners = 0;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const CORS = require('cors');
//PUPPETEER 🐱‍💻
const puppeteer = require('puppeteer');
//MIDDLEWARE
app.use(bodyParser.json());
app.use(CORS());

//START SERVER
const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
    console.log(`***Server is listening on ${PORT}***`);
});

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
    const results = names.slice(90, 100).map(async (name) => { 
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
        //START PROCESS
        return Promise.all(results)
        .then(complete => res.send({data: complete}))
        .catch(err => console.log('ERROR: ', err))
    })
})();