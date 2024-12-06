const fs = require('fs');
const https = require('https');
const { chromium } = require('playwright');

// 函数用于清理非法文件名字符
function sanitizeFileName(fileName) {
    return fileName.replace(/[<>:"\/\\|?*]+/g, ''); // 替换非法字符为空
}

// 函数用于下载文件并保存
function downloadFile(url, fileName) {
    const file = fs.createWriteStream(fileName);
    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`文件下载完成: ${fileName}`);
        });
    }).on('error', (err) => {
        fs.unlink(fileName); // 如果下载失败，删除文件
        console.error(`下载错误: ${err.message}`);
    });
}


(async () => {
    // 启动 Chromium 浏览器
    // 启动 Chromium 浏览器，并打开开发者工具
    const browser = await chromium.launch({
        headless: false, // 需要设置为 false 才能打开有 UI 的浏览器
        devtools: true   // 启用开发者工具
    });

    // 创建新的浏览器上下文
    const context = await browser.newContext();
    const page = await context.newPage();
// 函数用于清理非法文件名字符
//     function sanitizeFileName(fileName) {
//         return fileName.replace(/[<>:"\/\\|?*]+/g, ''); // 替换非法字符为空
//     }
    // 打开指定页面
    await page.goto('https://fzu.edu-xl.com/');

    // 在输入框里输入用户名
    await page.fill('//*[@id="txtUserName"]', '431121199908270019');

    // 在密码框里输入密码
    await page.fill('//*[@id="txtPwd"]', '431121199908270019'); // 替换为你实际的密码

    await page.click('//*[@id="btnSign"]'); // 替换为你的登录按钮选择器
    // // 等待页面加载完成（可根据需要指定条件）
    // await page.waitForLoadState('networkidle'); // 等待网络请求全部完成，页面加载完毕

    // 等待指定元素可见（使用 XPath 选择器）
    // await page.waitForSelector('xpath=/html/body/div[1]/div[1]/div[2]/div/div[3]/div[2]/ul/li[1]/span', { visible: true });
    // 保持浏览器打开一段时间，以便查看

    // 等待 iframe 加载
    const frameHandle = await page.waitForSelector('#iframUrl');
    const frame = await frameHandle.contentFrame(); // 切换到 iframe 内部
    // 等待 iframe 内的目标元素可见
    // await frame.waitForSelector('xpath=/html/body/div[1]/div[1]/div[2]/div/div[3]/div[2]/ul/li[1]/span', { timeout: 60000, visible: true });
    await frame.waitForSelector('xpath=/html/body/div[1]/div[1]/div[2]/div/div[1]/div[2]/ul/li[1]/span', { timeout: 60000, visible: true });
    console.log("a")
    // // 保持浏览器打开一段时间，以便查看
    // await page.waitForTimeout(2000); // 等待2分钟
    // await frame.click('xpath=/html/body/div[1]/div[1]/div[2]/div/div[5]/div/ul/li[2]/a');
    await page.waitForTimeout(2000); // 等待2分钟
    // 点击 iframe 内的目标元素
    // await frame.click('xpath=/html/body/div[1]/div[1]/div[2]/div/div[3]/div[2]/ul/li[1]/span');

    //点击课件
    await frame.click('xpath=/html/body/div[1]/div[1]/div[2]/div/div[3]/div[2]/ul/li[1]/span');
    //await frame.click('xpath=/html/body/div[1]/div[1]/div[2]/div/div[1]/div[2]/ul/li[1]/span');


    await page.waitForTimeout(2000); // 等待2分钟
    await frame.click('xpath=/html/body/div[2]/ul/li/div/div[2]/div/a');

    // 监听新打开的标签页
    context.on('page', async newPage => {
        console.log('新页面被打开');

        // 等待新页面加载完成
        await newPage.waitForLoadState('load', { timeout: 60000 });

        // const treeChildrenNodes = await newPage.$$('ul.ivu-tree-children');
        // console.log(treeChildrenNodes)
//         const treeChildrenNodes = await newPage.$$('ul.ivu-tree-children');
//
// // 遍历每个 ivu-tree-children
//         for (const treeNode of treeChildrenNodes) {
//             // 获取父级 title (render-content)
//             const parentTitleElement = await treeNode.$('span.render-content');
//             const parentTitle = parentTitleElement ? await parentTitleElement.getAttribute('title') : null;
//
//             console.log(`Parent title: ${parentTitle}`);
//
//             // 获取子级 video titles (render-content__video)
//             const videoNodes = await treeNode.$$('span.render-content__video');
//             for (const videoNode of videoNodes) {
//                 const videoTitle = await videoNode.getAttribute('title');
//                 console.log(`Video title: ${videoTitle} (Parent: ${parentTitle})`);
//             }
//         }



        // 假设获取了这些树结构节点
        // const treeChildrenNodes = await newPage.$$('ul.ivu-tree-children');
        // 获取 'ivu-tree' 下的一级 'ivu-tree-children'
        const treeChildrenNodes = await newPage.$$('div.ivu-tree > ul.ivu-tree-children');
        const treeData = {};

        // 遍历每个父节点
        for (const treeNode of treeChildrenNodes) {
            // 获取父级 render-content 的 title
            const parentElement = await treeNode.$('span.render-content');
            let parentTitle = null;

            // 如果存在父级元素，获取其 title
            if (parentElement) {
                parentTitle = await parentElement.getAttribute('title');
            }

            // 获取子节点
            const videoNodes = await treeNode.$$('span.render-content__video');

            // 如果没有父节点且存在子节点，将第一个子节点作为父节点
            if (!parentTitle && videoNodes.length > 0) {
                const firstChildNode = await videoNodes[0].getAttribute('title');
                parentTitle = firstChildNode;  // 用第一个子节点作为父节点
            }

            // 确保父节点存在，且它没有被重复添加
            if (parentTitle && !treeData[parentTitle]) {
                treeData[parentTitle] = [];
            }

            // 遍历子节点，将它们添加到父节点下
            for (const videoNode of videoNodes) {
                const videoTitle = await videoNode.getAttribute('title');

                // 检查子节点是否已经在父节点下，避免重复添加
                if (parentTitle && !treeData[parentTitle].includes(videoTitle)) {
                    // 保存 M3U8 URLs 的 map
                    const m3u8Map = new Map();

                    // 清除之前的 request 监听器，防止重复绑定
                    newPage.removeAllListeners('request');

                    // 使用闭包保存当前视频的标题
                    (function(currentTitle) {
                        newPage.on('request', async request => {
                            if (request.url().includes('m3u8') && !request.url().includes('aliyuncs')) {
                                console.log(`捕获到 m3u8 请求: ${request.url()}`);
                                // 清理文件名中的非法字符
                                const sanitizedTitle = sanitizeFileName(currentTitle);

                                // // 将当前视频的标题和 M3U8 URL 添加到 map 中
                                // m3u8Map.set(sanitizedTitle, request.url());
                                // treeData[parentTitle].push(m3u8Map);
                                // // 将 Map 转换为普通对象后推送到 treeData
                                // treeData[parentTitle].push(Object.fromEntries(m3u8Map));
                                // 将当前视频的标题和 M3U8 URL 添加到 treeData 中
                                treeData[parentTitle].push({ [sanitizedTitle]: request.url() });

                            }
                        });
                    })(videoTitle);

                    // 点击视频节点
                    await videoNode.click();

                    // 等待请求加载并捕获 m3u8 XHR 请求
                    await newPage.waitForTimeout(3000);

                }
            }
        }

        // 将最终的树结构保存为 JSON 文件
        fs.writeFileSync('treeData.json', JSON.stringify(treeData, null, 2), 'utf8');
        console.log('treeData.json has been saved as an object structure!');

    });

    // 截屏
    await page.screenshot({ path: 'example.png' });

    // 你也可以模拟点击登录按钮等后续操作

    // 保持浏览器打开一段时间，以便查看
    await page.waitForTimeout(2000000); // 等待20分钟
    console.log("关闭")

    // 关闭浏览器
    await browser.close();
})();
