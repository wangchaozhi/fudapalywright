const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// 清理非法文件名字符的函数
function sanitizeFolderName(folderName) {
    return folderName.replace(/[<>:"\/\\|?*]+/g, '_'); // 将非法字符替换为下划线或其他安全字符
}

(async () => {
    const pLimit = (await import('p-limit')).default; // 动态 import p-limit 模块
    const limit = pLimit(2); // 限制并发数为 2

    const mainFolder = path.join(__dirname, '毛泽东思想和中国特色社会主义...'); // 主文件夹路径

    // 创建目标文件夹，如果不存在则创建
    function createDirectory(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created folder: ${dir}`);
        }
    }

    // 下载 M3U8 视频的函数
    async function downloadM3U8WithFFmpeg(m3u8Url, outputFileName) {
        return new Promise((resolve, reject) => {
            ffmpeg(m3u8Url)
                .output(outputFileName)
                .on('end', function() {
                    console.log(`Download completed: ${outputFileName}`);
                    resolve(); // 下载完成时调用 resolve
                })
                .on('error', function(err) {
                    console.log(`Error downloading ${outputFileName}:`, err.message);
                    reject(err); // 下载失败时调用 reject
                })
                .run();
        });
    }

    // 处理下载任务的函数
    async function processM3U8Downloads(jsonFilePath) {
        // 读取并解析 JSON 文件
        const data = fs.readFileSync(jsonFilePath, 'utf8');
        const m3u8Addresses = JSON.parse(data);

        const downloadTasks = [];

        // 先创建主文件夹
        createDirectory(mainFolder);

        // 遍历每个专题，创建文件夹并下载视频
        for (const [folderName, videoArray] of Object.entries(m3u8Addresses)) {
            // 清理文件夹名称
            const sanitizedFolderName = sanitizeFolderName(folderName);

            // 创建每个专题的子文件夹
            const folderPath = path.join(mainFolder, sanitizedFolderName);
            createDirectory(folderPath);

            // 遍历视频数组，下载每个视频到对应的文件夹中
            videoArray.forEach(videoObj => {
                for (const [title, url] of Object.entries(videoObj)) {
                    const sanitizedTitle = sanitizeFolderName(title); // 同样清理文件名中的非法字符
                    const outputFileName = path.join(folderPath, `${sanitizedTitle}.mp4`);
                    console.log(`Preparing to download ${sanitizedTitle} from ${url}`);

                    // 使用 limit 来限制并发数
                    const downloadTask = limit(() => downloadM3U8WithFFmpeg(url, outputFileName));
                    downloadTasks.push(downloadTask);
                }
            });
        }

        // 等待所有下载任务完成
        await Promise.all(downloadTasks);
        console.log('All downloads completed');
    }

    const jsonFilePath = 'treeData.json'; // JSON 文件路径
    processM3U8Downloads(jsonFilePath); // 开始处理下载任务
})();
