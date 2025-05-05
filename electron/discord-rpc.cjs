const DiscordRPC = require('discord-rpc');
const os = require('os');

const clientId = '1369029970332094677'; 

let rpc = null;
let connected = false;
let startTimestamp = null;

async function initRPC() {
  if (rpc) return;
  
  try {
    rpc = new DiscordRPC.Client({ transport: 'ipc' });
    
    rpc.on('ready', () => {
      connected = true;
      startTimestamp = new Date();

      updateActivity('Idle');
    });

    await rpc.login({ clientId }).catch(console.error);
  } catch (error) {
    console.error(error);
  }
}

function updateActivity(state) {
  if (!rpc || !connected) return;
  
  try {
    const activity = {
      details: `That's cool`,
      state: state || 'Idle',
      startTimestamp: startTimestamp || new Date(),
      largeImageKey: 'nocturnal_logo', 
      largeImageText: 'Nocturnal',
      buttons: [
        { label: 'Get Nocturnal', url: 'https://nocturnal.top' }
      ],
      instance: false,
    };
    
    rpc.setActivity(activity).catch(console.error);
  } catch (error) {
    console.error(error);
  }
}

function setCodingStatus(scriptName) {
  updateActivity(`Editing something...`);
}

function setExecutingStatus() {
  updateActivity('Executing a script...');
}

function setIdleStatus() {
  updateActivity('Browsing scripts..');
}

function destroyRPC() {
  if (rpc) {
    rpc.destroy().catch(console.error);
    rpc = null;
    connected = false;
  }
}

module.exports = {
  initRPC,
  updateActivity,
  setCodingStatus,
  setExecutingStatus,
  setIdleStatus,
  destroyRPC
};
