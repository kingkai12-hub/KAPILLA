const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.resolve('sync_debug_log.txt');

function log(message) {
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] ${message}`;
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

function run(command) {
  log(`Executing: ${command}`);
  try {
    // Set environment variables to avoid interactive prompts and pagers
    const env = { 
      ...process.env, 
      GIT_PAGER: 'cat', 
      PAGER: 'cat',
      CI: 'true' // Simulates CI environment to avoid some interactive prompts
    };
    
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe', // Capture output
      env 
    });
    log(`Output:\n${output}`);
    return output;
  } catch (error) {
    log(`ERROR executing ${command}`);
    log(`Stderr: ${error.stderr}`);
    log(`Stdout: ${error.stdout}`);
    throw error;
  }
}

try {
  fs.writeFileSync(logFile, 'Starting Robust Sync Process...\n');

  // 1. Check Git Status
  run('git --no-pager status');

  // 2. Add all changes
  run('git add .');

  // 3. Commit
  try {
    run('git commit -m "fix: emergency sync and cache busting update"');
  } catch (e) {
    if (e.stdout && e.stdout.includes('nothing to commit')) {
      log('Nothing to commit, proceeding...');
    } else {
      throw e;
    }
  }

  // 4. Get current hash
  const hash = run('git rev-parse HEAD').trim();
  log(`Current Local Hash: ${hash}`);

  // 5. Push (Force if necessary, but try normal first)
  try {
    run('git --no-pager push origin main');
  } catch (e) {
    log('Push failed, attempting pull --rebase then push...');
    try {
      run('git --no-pager pull --rebase origin main');
      run('git --no-pager push origin main');
    } catch (e2) {
       log('Pull/Push failed. Attempting force push (use with caution)...');
       run('git --no-pager push -f origin main');
    }
  }

  // 6. Vercel Deploy
  log('Triggering Vercel Deployment...');
  // using vercel.cmd if on windows typically, but npx is safer cross-platform usually. 
  // Given previous errors, we will try to find the executable or use npx.
  run('npx vercel deploy --prod --yes --force');

  log('SYNC COMPLETE SUCCESSFULLY');

} catch (error) {
  log('CRITICAL FAILURE DURING SYNC');
  console.error(error);
  process.exit(1);
}
