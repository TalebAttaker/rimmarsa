#!/usr/bin/env node

const https = require('https');

const TOKEN = '6QKsEoUQWfUxHfpxH2qatJ1X';
const PROJECT_ID = 'prj_6uHyeIifMWWrJ6ouBy1zmYAGI9o7';

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('🔍 Checking Vercel project configuration...\n');

  // 1. Get current project settings
  const getOptions = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${PROJECT_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const { data: project } = await makeRequest(getOptions);

    console.log(`✅ Project: ${project.name}`);
    console.log(`   Root Directory: ${project.rootDirectory || '(root - NOT SET!)'}`);
    console.log(`   Framework: ${project.framework}`);

    const currentRoot = project.rootDirectory;

    if (currentRoot !== 'marketplace') {
      console.log(`\n🔧 Updating root directory to 'marketplace'...\n`);

      // 2. Update root directory
      const patchOptions = {
        hostname: 'api.vercel.com',
        path: `/v9/projects/${PROJECT_ID}`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      };

      const { data: updated } = await makeRequest(patchOptions, {
        rootDirectory: 'marketplace'
      });

      console.log(`✅ Root directory updated to: ${updated.rootDirectory}\n`);
    } else {
      console.log('✅ Root directory already set correctly!\n');
    }

    // 3. Trigger deployment
    console.log('🚀 Triggering production deployment...\n');

    const deployOptions = {
      hostname: 'api.vercel.com',
      path: '/v13/deployments',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const deployData = {
      name: 'rimmarsa',
      project: PROJECT_ID,
      target: 'production',
      gitSource: {
        type: 'github',
        ref: 'main',
        repoId: 'TalebAttaker/rimmarsa'
      }
    };

    const { data: deployment } = await makeRequest(deployOptions, deployData);

    if (deployment.id) {
      console.log(`✅ Deployment triggered successfully!`);
      console.log(`   ID: ${deployment.id}`);
      console.log(`   URL: https://${deployment.url}`);
      console.log(`   Status: ${deployment.readyState || 'QUEUED'}`);
      console.log(`\n🎉 Your app is deploying now!`);
      console.log(`   Watch at: https://vercel.com/talebattaker/rimmarsa\n`);
    } else {
      console.log(`⚠️  Response: ${JSON.stringify(deployment, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
