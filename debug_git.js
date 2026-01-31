
const { exec } = require('child_process');
const fs = require('fs');

const commands = [
  'git status',
  'git branch -vv',
  'git remote -v',
  'git log -n 3 --oneline',
  'git ls-remote origin main'
];

let output = '';

function runNext(index) {
  if (index >= commands.length) {
    console.log(output);
    return;
  }

  const cmd = commands[index];
  output += `\n=== ${cmd} ===\n`;
  
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      output += `ERROR: ${error.message}\n`;
    }
    if (stderr) {
      output += `STDERR: ${stderr}\n`;
    }
    output += stdout;
    runNext(index + 1);
  });
}

runNext(0);
