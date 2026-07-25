const app = express();
const axios = require("axios");
const os = require('os');
const fs = require("fs");
const path = require("path");
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const UPLOAD_URL = process.env.UPLOAD_URL || '';      
const PROJECT_URL = process.env.PROJECT_URL || '';    
const AUTO_ACCESS = process.env.AUTO_ACCESS || false; 
const FILE_PATH = process.env.FILE_PATH || '.tmp';   
const SUB_PATH = process.env.SUB_PATH || 'sub';       
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;         
const UUID = process.env.UUID || '9afd1229-b893-40c1-84dd-51e7ce204913'; 
const ARGO_DOMAIN = process.env.ARGO_DOMAIN || '';          
const ARGO_AUTH = process.env.ARGO_AUTH || '';              
const ARGO_PORT = process.env.ARGO_PORT || 8001;            
const CFIP = process.env.CFIP || 'www.visa.com.sg';            
const CFPORT = process.env.CFPORT || 443;                    
const NAME = process.env.NAME || '';                        

// 創建執行資料夾
if (!fs.existsSync(FILE_PATH)) {
  fs.mkdirSync(FILE_PATH);
  console.log(`${FILE_PATH} is created`);
}

function generateRandomName() {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const webName = generateRandomName();
const botName = generateRandomName();
let webPath = path.join(FILE_PATH, webName);
let botPath = path.join(FILE_PATH, botName);
let subPath = path.join(FILE_PATH, 'sub.txt');
let listPath = path.join(FILE_PATH, 'list.txt');
let bootLogPath = path.join(FILE_PATH, 'boot.log');
let configPath = path.join(FILE_PATH, 'config.json');

// 清理歷史檔案
function cleanupOldFiles() {
  try {
    const files = fs.readdirSync(FILE_PATH);
    files.forEach(file => {
      const filePath = path.join(FILE_PATH, file);
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
    });
  } catch (err) {}
}

// 生成 Xray 配置 (已修正 fallback dest 為 PORT，使 HTTP 請求能退回至 Express)
async function generateConfig() {
  const config = {
    log: { access: '/dev/null', error: '/dev/null', loglevel: 'none' },
    inbounds: [
      { 
        port: Number(ARGO_PORT), 
        protocol: 'vless', 
        settings: { 
          clients: [{ id: UUID, flow: 'xtls-rprx-vision' }], 
          decryption: 'none', 
          fallbacks: [
            { dest: Number(PORT) }, // 非節點路徑退回給 Express (3000)
            { path: "/vless-argo", dest: 3002 }, 
            { path: "/vmess-argo", dest: 3003 }, 
            { path: "/trojan-argo", dest: 3004 }
          ] 
        }, 
        streamSettings: { network: 'tcp' } 
      },
      { port: 3001, listen: "127.0.0.1", protocol: "vless", settings: { clients: [{ id: UUID }], decryption: "none" }, streamSettings: { network: "tcp", security: "none" } },
      { port: 3002, listen: "127.0.0.1", protocol: "vless", settings: { clients: [{ id: UUID, level: 0 }], decryption: "none" }, streamSettings: { network: "ws", security: "none", wsSettings: { path: "/vless-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
      { port: 3003, listen: "127.0.0.1", protocol: "vmess", settings: { clients: [{ id: UUID, alterId: 0 }] }, streamSettings: { network: "ws", wsSettings: { path: "/vmess-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
      { port: 3004, listen: "127.0.0.1", protocol: "trojan", settings: { clients: [{ password: UUID }] }, streamSettings: { network: "ws", security: "none", wsSettings: { path: "/trojan-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
    ],
    dns: { servers: ["https+local://8.8.8.8/dns-query"] },
    outbounds: [ { protocol: "freedom", tag: "direct" }, { protocol: "blackhole", tag: "block" } ]
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getSystemArchitecture() {
  const arch = os.arch();
  return (arch === 'arm' || arch === 'arm64' || arch === 'aarch64') ? 'arm' : 'amd';
}

function downloadFile(fileName, fileUrl, callback) {
  const writer = fs.createWriteStream(fileName);
  axios({ method: 'get', url: fileUrl, responseType: 'stream' })
    .then(response => {
      response.data.pipe(writer);
      writer.on('finish', () => {
        writer.close();
        callback(null, fileName);
      });
    })
    .catch(err => callback(err.message));
}

async function downloadFilesAndRun() {  
  const arch = getSystemArchitecture();
  const baseUrl = arch === 'arm' ? "https://arm64.ssss.nyc.mn" : "https://amd64.ssss.nyc.mn";
  
  const filesToDownload = [
    { fileName: webPath, fileUrl: `${baseUrl}/web` },
    { fileName: botPath, fileUrl: `${baseUrl}/bot` }
  ];

  for (const file of filesToDownload) {
    await new Promise((resolve, reject) => {
      downloadFile(file.fileName, file.fileUrl, (err) => err ? reject(err) : resolve());
    });
  }

  // 授權
  [webPath, botPath].forEach(p => fs.chmodSync(p, 0o775));

  // 運行 Xray
  exec(`nohup ${webPath} -c ${configPath} >/dev/null 2>&1 &`);
  console.log(`Core is running`);

  // 運行 Cloudflared
  let argoArgs = ARGO_AUTH.match(/^[A-Z0-9a-z=]{120,250}$/) 
    ? `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 run --token ${ARGO_AUTH}`
    : `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 --logfile ${bootLogPath} --loglevel info --url http://localhost:${ARGO_PORT}`;
  
  exec(`nohup ${botPath} ${argoArgs} >/dev/null 2>&1 &`);
  console.log(`Argo is running`);

  await new Promise(r => setTimeout(r, 5000));
}

// ==================== Express 路由設定 ====================

// 1. 首頁路由
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send("<h2>Server is running normally.</h2>");
});

// 2. 訂閱路由 (/sub 或環境變數 SUB_PATH)
app.get(`/${SUB_PATH}`, (req, res) => {
  const filePath = path.join(FILE_PATH, 'sub.txt');
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).send("Subscription not ready yet.");
  }
});

// ==================== 啟動服務 ====================

async function startserver() {
  try {
    cleanupOldFiles();
    await generateConfig();
    await downloadFilesAndRun();
  } catch (error) {
    console.error('Error:', error);
  }
}

app.listen(PORT, () => console.log(`Server on port:${PORT}`));
startserver();
