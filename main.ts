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
      nodeIntegration: true,
    },
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

}

const fs = require('fs');
let rainfallList = new Array();

ipcMain.on('file-location-read', (event, messages) => {
  readFiles(messages, onFileContent, onError);
});

function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + '\\' + filename, 'utf-8', function(err, content) {
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
  let lines = content.split('\r\n');
  lines.forEach(item => {
    let rainData = item.split('  ');
    let rainFall: any = {};
    rainFall.date = rainData[0];
    rainFall.latitude = rainData[1];
    rainFall.longitude = rainData[2];
    rainFall.temperatureMin = rainData[3];
    rainFall.temperatureMax = rainData[4];
    rainFall.temperatureAvg = rainData[5];
    rainFall.rainfall = rainData[6];
    rainFall.windspeed = rainData[7];
    rainFall.relativeHumidity = rainData[8];

    rainfallList.push(rainFall);
  });

  //console.log(rainfallList);
  calculateMonthly();
  calculateWeekly();
}

function calculateMonthly() {
  let monthlyAvg: any = {};
  let monthWiseSplit = rainfallList.reduce((res, obj) => {
    //let year = obj.date.substring(0, 4);
    let month = obj.date.substring(4, 6);
    //let day = obj.date.substring(6, 8);

    res[month] = res[month] || [];
    res[month].push(obj);
    return res;
  }, {});
  console.log(Object.values(monthWiseSplit));
}

function calculateWeekly() {

}

function writeToFile(filename, content) {
  fs.writeFile(filename, content, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
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
