const { spawn } = require("child_process");
const fs = require("fs");

const getTimeStamp = () => {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let yyyy = today.getFullYear();
  let hh = today.getHours();
  let min = today.getMinutes();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;
  if (hh < 10) hh = "0" + hh;
  if (min < 10) min = "0" + min;

  let ts = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + min + ":00Z";
  return ts;
};

const simulate = () => {
  const p1 = spawn("python", ["./scripts/p1.py"]);
  p1.on("exit", code => {
    let msg = `${p1.pid} p1 `;
    if (code === 0) msg += "Completed";
    else if (code === 1) msg += "Stopped";
    else msg += "Failed";
    msg += ` ${getTimeStamp()}\n`;
    logger(msg);
    console.log(`p1 terminated with exit code ${code} from ps2`);
  });
};

const logger = content => {
  fs.appendFile("./log.txt", content, err => {
    if (err) throw err;
  });
};

const startProcess = fName => {
  const pythProcess = spawn("python", [fName]);
  pythProcess.on("exit", code => {
    let msg = `${pythProcess.pid} ${fName} `;
    if (code === 0) msg += "Completed";
    else if (code === 1) msg += "Stopped";
    else msg += "Failed";
    msg += ` ${getTimeStamp()}\n`;
    logger(msg);
  });
};

const stopProcess = serverID => {
  process.kill(serverID);
};

const getUnixTime = time => {
  let finalTime = "";
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();

  today = yyyy + "-" + mm + "-" + dd + "T";
  finalTime += today;

  let hours = "";
  let i;
  for (i = 0; i < time.length; i++) {
    if (time.charAt(i) === ":") break;
    hours += time.charAt(i);
  }
  i++;
  let minutes = "";
  let newHours = "";
  for (; i < time.length; i++) {
    if (
      time.charAt(i) === "a" ||
      time.charAt(i) === "p" ||
      time.charAt(i) === "A" ||
      time.charAt(i) === "P"
    )
      break;
    minutes += time.charAt(i);
  }
  if (time.charAt(i) === "a") {
    if (parseInt(hours) < 10) hours = "0" + hours;
    if (parseInt(hours) === 12) hours = "00";
  } else {
    let h = parseInt(hours);
    h += 12;
    if (h == 24) newHours = "12";
    else newHours = h.toString();
    hours = newHours;
  }
  finalTime += hours + ":" + minutes + ":00Z";
  return finalTime;
};

// Converts YYYYMMDDHHMM to DD/MM/YYYY HH:MM format (for Windows)
const winConvertDateTime = wmicDateTime => {
  let myDate = wmicDateTime.substring(0, 8);
  let myTime = wmicDateTime.substring(8, 12);

  let dd = myDate.substring(6);
  let mm = myDate.substring(4, 6);
  let yyyy = myDate.substring(0, 4);

  let hh = myTime.substring(0, 2);
  let min = myTime.substring(2);

  return yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + min + ":00Z";
};

// format output for WMI Script output (for Windows)
const winFormatOutput = output => {
  let runningProcesses = [];
  let out = output.trim().split("\r\n");

  out.forEach(el => {
    const splits = el.split(" ");
    const runningProcess = {
      pid: parseInt(splits[2]),
      scriptType: splits[0],
      processName: splits[1].substring(10),
      startTime: winConvertDateTime(splits[3]),
      endTime: "",
      status: "In Progress",
    };
    runningProcesses.push(runningProcess);
  });

  return runningProcesses;
};

const unixFormatOutput = stdout => {
  let processList = stdout.split("/n");
  console.log(processList.length);
  let pythonProcesses = [];
  processList.forEach(process => {
    if (process.substring(process.length - 3) === ".py") {
      let split = process.split(/\s+/);
      let p = {
        pid: split[1],
        scriptType: "python",
        processName: split[split.length - 1].split("/")[2],
        startTime: split[8],
      };
      pythonProcesses.push(p);
    }
  });
  return pythonProcesses;
};

const getServerName = async serverId => {
  const server = await server.findById(serverId);
  return server.serverName;
};

const getProcessName = async processId => {
  const process = await process.findById(processId);
  return process.processName;
};

module.exports = {
  startProcess,
  winConvertDateTime,
  winFormatOutput,
  simulate,
  startProcess,
  stopProcess,
  unixFormatOutput,
  getTimeStamp,
  getProcessName,
  getServerName,
  getUnixTime,
};
