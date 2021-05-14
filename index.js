//plugins
const puppeteer = require('puppeteer');
const Excel = require('exceljs');

//username and password for flashscore
let account = {
  username: 'mietki.mietkowski@interia.pl',
  password: 'kanapka123'
}

//create a function to get information of matches.
function getScheduledMatches(parent, date) {
  // create container for the scheduled matches dates in array
  const scheduled = [];

  //search and assign all scheduled matches from favourites
  let allScheduledMatches = parent.querySelectorAll('.event__match--scheduled');
  //store each of the scheduled matches in an array
  allScheduledMatches.forEach(item => {
    try {
      //search and assign all information of matches into an object
      let homeTeam = item.querySelector('.event__participant--home').innerText;
      let awayTeam = item.querySelector('.event__participant--away').innerText;
      let time = item.querySelector('.event__time').innerText;
      //insert each object into container
      scheduled.push({
        homeTeam, awayTeam, time, date,
      });
    }
    catch (err) {
      return err;
    }
  });
  //return the container
  return scheduled;
}

//create a function to get all the match dates.
function ScrapDates(document) {
  //search and assign all information of leagues into an node list
  const leagues = document.querySelectorAll('.leagues--live')
  //grab the child element (subtabs) of each different league and assign it as variable
  const children = Array.from(leagues[0].children)
  //iterate through each different child of subtabs

  let scrapped = children.filter(info => info.child.children[0].className.startsWith('info')).map((child) => {
    //assign each of the dates text into an object
    let dateContent = child.children[0].textContent
    //call function to pass data
    let matchInformation = getScheduledMatches(child.nextSibling, dateContent)
    //filter matchInformation using dateContent + matchInformation.date
    let filteredMatches = matchInformation.filter(date => date.date == dateContent)
    //create container which will hold the day and matches
    let content = {
      //use uuid from npm 
      dateContent: dateContent,
      matchInformation: filteredMatches,
    }
    //return container
    return content;
  })
  //return container
  return scrapped;
}






//create a function that collects the matches information and inserts it to excel file.
function insertIntoExcel() {
  //Create the workbook & add worksheet
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('ExampleSheet');
  // // add column headers
  worksheet.columns = [
    { header: 'Druzyna A' },
    { header: 'Druzyna B' },
    { header: 'Data' },
    { header: 'Czas' },
  ];
  //iterate through each match from the object list and assign as object
  let matchList = getMatches.map(match => match.matchInformation)
  // extract array from array
  matchList.forEach(function (subArray) {
    subArray.forEach(function (match) {
      //set an appropriate format for match date by cutting text after specific char
      let strippedDate = match.date.split('-').pop();
      // Add rows as Array values
      worksheet.addRow([
        match.homeTeam,
        match.awayTeam,
        strippedDate,
        match.time,
      ]);
    });
  });
  // save excel file on a drive
  workbook.xlsx.writeFile('FlashScrapper.xlsx').then(() => {
    console.log("FILE SAVED.");
  })
}

//****initiating Puppeteer for web scrapping
puppeteer.launch({ headless: true, args: ["--window-position=0,0", "--window-size=1280,1024",] }).then(async browser => {


  //open a new page 
  const page = await browser.newPage();
  //set size of the browser for testing purposes
  await page.setViewport({ width: 1280, height: 1024 })
  //navigate to Flashscore favourites
  await page.goto('https://www.flashscore.co.uk/favourites/');
  //wait until needed element loads
  await page.waitForSelector('body');
  //login into the service
  await page.click('#signIn');
  //wait for login page transition


  await page.waitForTimeout(2000);
  await page.type('#email', account.username)
  await page.type('#passwd', account.password)
  await page.click('#login')
  //wait until needed element loads
  await page.waitForSelector('.event__match--scheduled', { visible: true });


  //manipulate the page content
  let getMatches = await page.evaluate(() => {

    //return function
    return ScrapDates(document)
  });

  //close the browser
  await browser.close();
  console.log('BROWSER CLOSED.');
  console.log(JSON.stringify(getMatches))

})