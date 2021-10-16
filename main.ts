import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';

let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

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
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  /*
  if (serve) {
    win.webContents.openDevTools();
  }
  */

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

const fs = require('fs');

ipcMain.on('file-location-read', (event, messages) => {
  readFiles(messages);
});

function readFiles(dirname) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach((filename: string) => {
      fs.readFile(dirname + '/' + filename, 'utf-8', function(err, content: any) {
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
  const lines = content.split('\r\n');
  lines.forEach(item => {
    const rainData = item.split('  ');
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

  const isAvgRequired = true;

  calculateMonthly(filename, rainfallList, isAvgRequired);
  calculateWeekly(filename, rainfallList, isAvgRequired);
}

function calculateMonthly(filename: string, rainfallList: any, isAvgRequired: boolean) {
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

        let consolidateData = false;

        if ((i + 1) < rainfallList.length) {
            nextMonth = rainfallList[i + 1].date.substring(0, 6);
            if (nextMonth !== currMonth) {
                consolidateData = true;
            }
        } else {
            consolidateData = true;
        }

        if (consolidateData) {
            const tempWeeklyData: any = {};
            tempWeeklyData.month = currMonth;
            tempWeeklyData.latitude = rainfallList[i].latitude;
            tempWeeklyData.longitude = rainfallList[i].longitude;

            if (isAvgRequired) {
                tempWeeklyData.solarRadiation = (sumSolarRadiation / numberOfDays).toFixed(2);
                tempWeeklyData.temperatureMax = (sumTemperatureMax / numberOfDays).toFixed(2);
                tempWeeklyData.temperatureMin = (sumTemperatureMin / numberOfDays).toFixed(2);
                tempWeeklyData.rainfall = (sumRainfall / numberOfDays).toFixed(2);
                tempWeeklyData.windspeed = (sumWindspeed / numberOfDays).toFixed(2);
                tempWeeklyData.relativeHumidity = (sumRelativeHumidity / numberOfDays).toFixed(2);
            } else {
                tempWeeklyData.solarRadiation = sumSolarRadiation.toFixed(2);
                tempWeeklyData.temperatureMax = sumTemperatureMax.toFixed(2);
                tempWeeklyData.temperatureMin = sumTemperatureMin.toFixed(2);
                tempWeeklyData.rainfall = sumRainfall.toFixed(2);
                tempWeeklyData.windspeed = sumWindspeed.toFixed(2);
                tempWeeklyData.relativeHumidity = sumRelativeHumidity.toFixed(2);
            }

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

    if (isAvgRequired) {
        writeToCSV(weeklyData, './' + filename + '_avg_monthly.csv');
    } else {
        writeToCSV(weeklyData, './' + filename + '_sum_monthly.csv');
    }
}

function calculateWeekly(filename: string, rainfallList: any, isAvgRequired: boolean) {
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
            tempWeeklyData.latitude = rainfallList[i].latitude;
            tempWeeklyData.longitude = rainfallList[i].longitude;

            if (isAvgRequired) {
                tempWeeklyData.solarRadiation = (sumSolarRadiation / 7).toFixed(2);
                tempWeeklyData.temperatureMax = (sumTemperatureMax / 7).toFixed(2);
                tempWeeklyData.temperatureMin = (sumTemperatureMin / 7).toFixed(2);
                tempWeeklyData.rainfall = (sumRainfall / 7).toFixed(2);
                tempWeeklyData.windspeed = (sumWindspeed / 7).toFixed(2);
                tempWeeklyData.relativeHumidity = (sumRelativeHumidity / 7).toFixed(2);
            } else {
                tempWeeklyData.solarRadiation = sumSolarRadiation.toFixed(2);
                tempWeeklyData.temperatureMax = sumTemperatureMax.toFixed(2);
                tempWeeklyData.temperatureMin = sumTemperatureMin.toFixed(2);
                tempWeeklyData.rainfall = sumRainfall.toFixed(2);
                tempWeeklyData.windspeed = sumWindspeed.toFixed(2);
                tempWeeklyData.relativeHumidity = sumRelativeHumidity.toFixed(2);
            }

            weeklyData.push(tempWeeklyData);

            sumSolarRadiation = 0;
            sumTemperatureMax = 0;
            sumTemperatureMin = 0;
            sumRainfall = 0;
            sumWindspeed = 0;
            sumRelativeHumidity = 0;
        }
    }

    if (isAvgRequired) {
        writeToCSV(weeklyData, './' + filename + '_avg_weekly.csv');
    } else {
        writeToCSV(weeklyData, './' + filename + '_sum_weekly.csv');
    }
}

function writeToCSV(contents: any, filename: string) {
  const replacer = (key: string, value: any) => (value === null ? '' : value); // specify how you want to handle null values here
  const header = Object.keys(contents[0]);
  let csv = contents.map(row =>
    header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',')
  );
  csv.unshift(header.join(','));
  csv = csv.join('\r\n');

  writeToFile(csv, filename);
}

function writeToFile(contents: any, filename: string) {
  fs.writeFile(filename, contents, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log(filename + ' is saved');
  });
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
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
