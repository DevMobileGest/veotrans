const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

async function getVideoById(folderPath, id) {
    const videos = await getVideosFromFolder(folderPath);
    return videos.find(video => video.id === parseInt(id));
}

async function getFromFolder(folderPath, category) {
    const videos = [];
    let id = 0;

    try {
        const subfolders = await fsp.readdir(folderPath, { withFileTypes: true });

        for (const subfolder of subfolders) {
            if (subfolder.isDirectory() && subfolder.name.toLowerCase() <= 'g' && subfolder.name.toLowerCase() >= 'a') {
                const subfolderPath = path.join(folderPath, subfolder.name);
                const files = await fsp.readdir(subfolderPath);
                let CategoryName = ''; // Moved inside the loop to reset for each subfolder

                for (const file of files) {
                    const filePath = path.join(subfolderPath, file);
                    const stat = await fsp.stat(filePath);

                    switch (subfolder.name) {
                        case 'A':
                            CategoryName = 'Accion';
                            break;
                        case 'B':
                            CategoryName = 'Estreno';
                            break;
                        case 'C':
                            CategoryName = 'Comedia';
                            break;
                        case 'D':
                            CategoryName = 'Drama';
                            break;
                        case 'E':
                            CategoryName = 'Romance';
                            break;
                        case 'F':
                            CategoryName = 'Animacion';
                            break;
                        case 'G':
                            CategoryName = 'Documental'
                    }
                    if (stat.isFile()) {
                        const fileName = path.parse(file).name;
                        const video = {
                            id: id++,
                            name: fileName,
                            category: CategoryName,
                            path: filePath,
                            cover: `/img/${fileName}`
                        };
                        if (category.toLowerCase() === 'all' || category.toLowerCase() === subfolder.name.toLowerCase()) {
                            videos.push(video);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error reading folder ${folderPath}:`, error);
        return [];
    }

    return videos;
}

async function getFileById(folderPath, id) {
    const files = await getFilesFromFolder(folderPath);
    return files.find(file => file.id === parseInt(id));
}

async function getRandomAd(folderPath) {
    try {
        const files = await fsp.readdir(folderPath);
        if (files.length === 0) {
            console.warn(`No ad files found in ${folderPath}`);
            return null;
        }
        const randomIndex = Math.floor(Math.random() * files.length);
        const randomFile = files[randomIndex];
        const filePath = path.join(folderPath, randomFile);

        const videoContent = await fsp.readFile(filePath);

        return videoContent;
    } catch (error) {
        console.error(`Error getting random ad from ${folderPath}:`, error);
        return null;
    }
}

async function getVideosFromFolder(folderPath) {
    const videos = [];
    let id = 0;

    try {
        const files = await fsp.readdir(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = await fsp.stat(filePath);
            if (stat.isFile()) {
                const fileName = path.parse(file).name;
                const video = {
                    id: id++,
                    name: fileName,
                    path: filePath
                };
                videos.push(video);
            }
        }
    } catch (error) {
        console.error(`Error reading video folder ${folderPath}:`, error);
        return [];
    }

    return videos;
}

async function serveVideoFile(videoPath, req, res) {
    try {
        const stat = await fsp.stat(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
    
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = end - start + 1;
          const file = fs.createReadStream(videoPath, { start, end });
          const headers = {
            'Content-Type': 'video/mp4',
            'Content-Length': chunkSize,
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
          };
          res.status(206).set(headers);
          file.pipe(res);
        } else {
          const headers = {
            'Content-Type': 'video/mp4',
            'Content-Length': fileSize,
            'Accept-Ranges': 'bytes',
          };
          res.status(200).set(headers);
          fs.createReadStream(videoPath).pipe(res);
        }
      } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }
}

async function serveMusicFile(musicPath, req, res) {
    try {
        const stat = await fsp.stat(musicPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;
            const file = fs.createReadStream(musicPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Range': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'audio/mpeg'
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
            };
            res.writeHead(200, head);
            fs.createReadStream(musicPath).pipe(res);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

async function getFilesFromFolder(folderPath) {
    const files = [];
    try {
        const items = await fsp.readdir(folderPath);

        for (const item of items) {
            const itemPath = path.join(folderPath, item);
            const stat = await fsp.stat(itemPath);

            if (stat.isFile()) {
                const fileName = path.parse(item).name;
                const fileExtension = path.extname(item).toLowerCase();

                if (fileExtension === '.mp4' || fileExtension === '.mov' || fileExtension === '.avi') {
                    files.push({
                        id: files.length,
                        name: fileName,
                        type: 'video',
                        path: itemPath
                    });
                } else if (fileExtension === '.jpg' || fileExtension === '.png' || fileExtension === '.gif') {
                    files.push({
                        id: files.length,
                        name: fileName,
                        type: 'image',
                        path: itemPath
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error reading files from folder ${folderPath}:`, error);
        return [];
    }

    return files;
}

module.exports = {
    getVideoById,
    getFromFolder,
    getFileById,
    getRandomAd,
    getVideosFromFolder,
    serveVideoFile,
    serveMusicFile,
    getFilesFromFolder
};