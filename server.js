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

const celebs = [];

//HEADLESS CHROME
(async () => {

    //INIT PUPPETEER
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const celebComedianList = 'https://en.wikipedia.org/wiki/List_of_comedians' 

    //GET CELEB COMEDIAN NAMES PAGE
    await page.goto(celebComedianList);
    const names = await page.evaluate(
        () => Array.from(document.querySelectorAll('div ul li a[title]'))
        .map(element => element.textContent.split(' ').join('_'))
    );

    celebs.push(names);
    console.log('celebs', celebs.map((celeb) => celeb));

    //ENDPOINTS
    /* GET: COMEDIAN CELEBS */
    app.get('/comedians', (req, res) => {
        console.log(names)
        res.send(names)
    });

    /* GET: CELEB BIRTH DATA BY NAME (?NAME=) */
    app.get('/data', async (req, res) => {
        //console.log(`https://en.wikipedia.org/api/rest_v1/page/html/${req.query.name}?redirect=false`);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`https://en.wikipedia.org/api/rest_v1/page/html/${req.query.name}?redirect=false`)
        const data = await page.evaluate(
            () => document.querySelector('span .bday').textContent
        )
        console.log(data)
        res.send(data)

    });

    await browser.close();
})();