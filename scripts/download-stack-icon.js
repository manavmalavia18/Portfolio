const fs = require('fs');
const path = require('path');
const https = require('https');

const EN_JSON_PATH = path.join(__dirname, '../contents/en.json');
const TR_JSON_PATH = path.join(__dirname, '../contents/tr.json');
const OUTPUT_DIR = path.join(__dirname, '../public/stack');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function download(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: Status Code ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

async function run() {
    const enContent = JSON.parse(fs.readFileSync(EN_JSON_PATH, 'utf8'));
    const trContent = JSON.parse(fs.readFileSync(TR_JSON_PATH, 'utf8'));

    const stack = enContent.stack;
    if (!stack) {
        console.error("No stack block found in en.json");
        return;
    }

    const categories = ['frontend', 'backend', 'database', 'tools'];
    
    for (const category of categories) {
        const items = stack[category];
        if (!items) continue;

        for (const item of items) {
            const url = item.icon;
            if (!url.startsWith('http')) {
                continue;
            }

            let ext = '.svg';
            if (url.includes('.png')) {
                ext = '.png';
            } else if (url.includes('.jpg') || url.includes('.jpeg')) {
                ext = '.jpg';
            }

            const cleanName = item.name
                .toLowerCase()
                .replace(/\.js$/, 'js')
                .replace(/#/g, 'sharp')
                .replace(/\+/g, 'plus')
                .replace(/[^a-z0-9]/g, '');
            
            const filename = `${cleanName}${ext}`;
            const destPath = path.join(OUTPUT_DIR, filename);
            const localPath = `/stack/${filename}`;

            console.log(`Downloading ${item.name} from ${url} -> ${filename}...`);
            try {
                await download(url, destPath);
                item.icon = localPath;

                const trItem = trContent.stack?.[category]?.find(t => t.name === item.name);
                if (trItem) {
                    trItem.icon = localPath;
                }
            } catch (err) {
                console.error(`Error downloading ${item.name}:`, err.message);
            }
        }
    }

    fs.writeFileSync(EN_JSON_PATH, JSON.stringify(enContent, null, 4), 'utf8');
    fs.writeFileSync(TR_JSON_PATH, JSON.stringify(trContent, null, 4), 'utf8');
    console.log("Updated en.json and tr.json successfully!");
}

run();
