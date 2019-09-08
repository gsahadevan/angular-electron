import { app, BrowserWindow, screen, ipcMain } from "electron";
import * as path from "path";
import * as url from "url";

let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === "--serve");

function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true
    }
  });

  if (serve) {
    require("electron-reload")(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL("http://localhost:4200");
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "dist/index.html"),
        protocol: "file:",
        slashes: true
      })
    );
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

const fs = require("fs");

ipcMain.on("file-location-read", (event, messages) => {
  readFiles(messages, onFileContent, onError);
});

function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + "/" + filename, "utf-8", function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}

function onError(err) {
  console.log(err);
}

function onFileContent(filename, content) {

  const rainfallList: any = [];

  const lines = content.split("\r\n");
  lines.forEach(item => {
    const rainData = item.split("  ");
    const rainFall: any = {};
    rainFall.date = rainData[0];
    rainFall.latitude = rainData[1];
    rainFall.longitude = rainData[2];
    rainFall.solarRadiation = parseFloat(rainData[3]);
    rainFall.temperatureMin = parseFloat(rainData[5]);
    rainFall.temperatureMax = parseFloat(rainData[4]);
    rainFall.rainfall = parseFloat(rainData[6]);
    rainFall.windspeed = parseFloat(rainData[7]);
    rainFall.relativeHumidity = parseFloat(rainData[8]);

    rainfallList.push(rainFall);
  });

  // console.log(rainfallList);
  calculateMonthly(filename, rainfallList);
  calculateWeekly(filename, rainfallList);
  console.log(filename);
}

/*
function calculateMonthly() {
  let monthlyAvg: any = {};
  let monthWiseSplit = rainfallList.reduce((res, obj) => {
    // let year = obj.date.substring(0, 4);
    let month = obj.date.substring(4, 6);
    // let day = obj.date.substring(6, 8);

    res[month] = res[month] || [];
    res[month].push(obj);
    return res;
  }, {});
  console.log(Object.values(monthWiseSplit));
}
*/

function calculateMonthly(filename: string, rainfallList: any) {
    const weeklyData: any = [];
    let sumSolarRadiation = 0;
    let sumTemperatureMin = 0;
    let sumTemperatureMax = 0;
    let sumRainfall = 0;
    let sumWindspeed = 0;
    let sumRelativeHumidity = 0;

    let numberOfDays = 0;
    let currMonth = rainfallList[0].date.substring(0, 6);
    let nextMonth = '';

    const year = rainfallList[0].date.substring(0, 4);

  for (let i = 0; i < rainfallList.length; i++) {
    sumSolarRadiation += rainfallList[i].solarRadiation;
    sumTemperatureMax += rainfallList[i].temperatureMax;
    sumTemperatureMin += rainfallList[i].temperatureMin;
    sumRainfall += rainfallList[i].rainfall;
    sumWindspeed += rainfallList[i].windspeed;
    sumRelativeHumidity += rainfallList[i].relativeHumidity;

    numberOfDays++;

    if ((i + 1) < rainfallList.length) {
        nextMonth = rainfallList[i + 1].date.substring(0, 6);
        if (nextMonth !== currMonth) {
            const tempWeeklyData: any = {};
            tempWeeklyData.month = currMonth;
            // tempWeeklyData.weekDay = rainfallList[i].date;
            tempWeeklyData.latitude = rainfallList[i].latitude;
            tempWeeklyData.longitude = rainfallList[i].longitude;

            tempWeeklyData.solarRadiation = (sumSolarRadiation / numberOfDays).toFixed(2);
            tempWeeklyData.temperatureMax = (sumTemperatureMax / numberOfDays).toFixed(2);
            tempWeeklyData.temperatureMin = (sumTemperatureMin / numberOfDays).toFixed(2);
            tempWeeklyData.rainfall = (sumRainfall / numberOfDays).toFixed(2);
            tempWeeklyData.windspeed = (sumWindspeed / numberOfDays).toFixed(2);
            tempWeeklyData.relativeHumidity = (sumRelativeHumidity / numberOfDays).toFixed(2);

            weeklyData.push(tempWeeklyData);

            sumSolarRadiation = 0;
            sumTemperatureMax = 0;
            sumTemperatureMin = 0;
            sumRainfall = 0;
            sumWindspeed = 0;
            sumRelativeHumidity = 0;

            numberOfDays = 0;
            currMonth = nextMonth;
        }
    } else {
        const tempWeeklyData: any = {};
            tempWeeklyData.month = currMonth;
            // tempWeeklyData.weekDay = rainfallList[i].date;
            tempWeeklyData.latitude = rainfallList[i].latitude;
            tempWeeklyData.longitude = rainfallList[i].longitude;

            tempWeeklyData.solarRadiation = (sumSolarRadiation / numberOfDays).toFixed(2);
            tempWeeklyData.temperatureMax = (sumTemperatureMax / numberOfDays).toFixed(2);
            tempWeeklyData.temperatureMin = (sumTemperatureMin / numberOfDays).toFixed(2);
            tempWeeklyData.rainfall = (sumRainfall / numberOfDays).toFixed(2);
            tempWeeklyData.windspeed = (sumWindspeed / numberOfDays).toFixed(2);
            tempWeeklyData.relativeHumidity = (sumRelativeHumidity / numberOfDays).toFixed(2);

            weeklyData.push(tempWeeklyData);

            sumSolarRadiation = 0;
            sumTemperatureMax = 0;
            sumTemperatureMin = 0;
            sumRainfall = 0;
            sumWindspeed = 0;
            sumRelativeHumidity = 0;

            numberOfDays = 0;
            currMonth = nextMonth;
    }

  }

  // console.log(weeklyData);

  writeToCSV(weeklyData, './' + filename + '_monthly.csv');
}

function calculateWeekly(filename: string, rainfallList: any) {
    const weeklyData: any = [];
    let sumSolarRadiation = 0;
    let sumTemperatureMin = 0;
    let sumTemperatureMax = 0;
    let sumRainfall = 0;
    let sumWindspeed = 0;
    let sumRelativeHumidity = 0;

    const year = rainfallList[0].date.substring(0, 4);

  for (let i = 0; i < rainfallList.length; i++) {
    sumSolarRadiation += rainfallList[i].solarRadiation;
    sumTemperatureMax += rainfallList[i].temperatureMax;
    sumTemperatureMin += rainfallList[i].temperatureMin;
    sumRainfall += rainfallList[i].rainfall;
    sumWindspeed += rainfallList[i].windspeed;
    sumRelativeHumidity += rainfallList[i].relativeHumidity;

    if (i !== 0 && (i + 1) % 7 === 0) {
        const tempWeeklyData: any = {};
        tempWeeklyData.week = (i + 1) / 7;
        // tempWeeklyData.weekDay = rainfallList[i].date;
        tempWeeklyData.latitude = rainfallList[i].latitude;
        tempWeeklyData.longitude = rainfallList[i].longitude;

        tempWeeklyData.solarRadiation = (sumSolarRadiation / 7).toFixed(2);
        tempWeeklyData.temperatureMax = (sumTemperatureMax / 7).toFixed(2);
        tempWeeklyData.temperatureMin = (sumTemperatureMin / 7).toFixed(2);
        tempWeeklyData.rainfall = (sumRainfall / 7).toFixed(2);
        tempWeeklyData.windspeed = (sumWindspeed / 7).toFixed(2);
        tempWeeklyData.relativeHumidity = (sumRelativeHumidity / 7).toFixed(2);

        weeklyData.push(tempWeeklyData);

        sumSolarRadiation = 0;
        sumTemperatureMax = 0;
        sumTemperatureMin = 0;
        sumRainfall = 0;
        sumWindspeed = 0;
        sumRelativeHumidity = 0;
    }
  }

  // console.log(weeklyData);

  /*
  const jsonString = JSON.stringify(weeklyData);

  fs.writeFile('./weekly.json', jsonString, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log('The file was saved!');
  });
  */

  writeToCSV(weeklyData, './' + filename + '_weekly.csv');
}

function writeToCSV(contents: any, filename: string) {
  const items = contents;
  const replacer = (key, value) => (value === null ? "" : value); // specify how you want to handle null values here
  const header = Object.keys(items[0]);
  let csv = items.map(row =>
    header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(",")
  );
  csv.unshift(header.join(","));
  csv = csv.join("\r\n");

  writeToFile(filename, csv);
}

function writeToFile(filename, content) {
  fs.writeFile(filename, content, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log(filename + ' is saved');
  });
}
/*
function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  return result;
}
*/

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on("ready", createWindow);

  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
