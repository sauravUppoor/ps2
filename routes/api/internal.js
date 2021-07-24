const express = require("express");
const { exec } = require("child_process");
const { kill } = require("process");
const process = require("process");
const fs = require("fs");
const router = express.Router();

const {
  startProcess,
  winFormatOutput,
  getUnixTime,
} = require("../../processHelper");

router.post("/start", (req, res) => {
  const processName = req.body.pname;

  const fName = "./scripts/" + processName + ".py";
  startProcess(fName);
  res.status(200).send({ msg: "Process created successfully" });
});

router.post("/stop", (req, res) => {
  const pid = req.body.osId;
  kill(pid);
  res
    .status(200)
    .send({ msg: `Successfully stopped the process with PID ${pid}` });
});

//Get status of a running process
router.get("/status", (req, res) => {
  // get completed processes
  let completedProcesses = [];
  fs.readFile("./log.txt", "utf8", (err, data) => {
    if (err) {
      res.send(404).send({ msg: "File not found" });
    }
    lines = data.split("\n");
    // console.log(lines);
    if (lines[0] !== "") {
      lines.forEach(line => {
        splits = line.trim().split(" ");
        if (splits.length !== 1) {
          const completedProcess = {
            pid: parseInt(splits[0]),
            processName: splits[1],
            endTime: splits[3],
            status: splits[2],
          };
          completedProcesses.push(completedProcess);
        }
      });
    }
  });

  console.log(completedProcesses);
  // OS = win32/win64
  if (process.platform === "win32") {
    // Tasklist waits till python processes end
    // const tasklist = "tasklist -V";

    // WMIC doesn't return the process file name
    // const wmic =
    //   "WMIC PROCESS WHERE  ( NAME like '%python.exe%' OR NAME like '%perl.exe%' ) GET PROCESSID, NAME, CREATIONDATE";

    // WMI script in powershell - get PID, startTime, script name
    const ps =
      "get-wmiobject Win32_process -filter \"Name='python.exe' or Name='perl.exe'\" | foreach -process {$_.CommandLine + ' ' +  $_.ProcessId + ' ' +  $_.CreationDate}";

    exec(ps, { shell: "powershell" }, (error, stdout, stderr) => {
      // clear the log file
      fs.truncate("./log.txt", err => {
        if (err) {
          res.send(500).send({ msg: "Truncate file failed" });
        }
      });
      if (stdout !== "") {
        runningProcesses = winFormatOutput(stdout);
        res.status(200).send(runningProcesses.concat(completedProcesses));
      } else {
        res.status(200).send(completedProcesses);
      }
    });
  } else {
    // handle unix
    let processList = [];
    let pythonProcesses = [];
    exec("ps aux", (stderr, stdout) => {
      if (stderr) {
        res.status(500).send({ msg: "ps command failed" });
      }
      processList = stdout.split("\n");
      processList.forEach(process => {
        if (process.substring(process.length - 3) === ".py") {
          let split = process.split(/\s+/);
          let pName = split[split.length - 1].split("/")[2];
          pName = pName.split(".")[0];
          let p = {
            pid: parseInt(split[1]),
            scriptType: "python",
            processName: pName,
            startTime: getUnixTime(split[8]),
            endTime: "",
            status: "In Progress",
          };
          pythonProcesses.push(p);
        }
      });
      fs.truncate("./log.txt", err => {
        if (err) {
          res.send(500).send({ msg: "Truncate file failed" });
        }
      });
      runningProcesses = pythonProcesses;
      res.status(200).send(runningProcesses.concat(completedProcesses));
    });
  }
});

module.exports = router;
