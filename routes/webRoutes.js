const express = require('express');
const path = require('path');
const fs = require('fs'); // fs is still needed for fs.readdir and fs.access in /img and /apk routes

const {
    getVideoById,
    getFromFolder,
    getFileById,
    getRandomAd,
    getVideosFromFolder,
    serveVideoFile,
    serveMusicFile,
    getFilesFromFolder
} = require('../helpers/mediaHelpers');

const router = express.Router();

// Web
router.get('/', async (req, res) => {
    try {
        const themeFolder = path.join(__dirname, '../assets/theme/');
        const themes = await getFilesFromFolder(themeFolder);
        res.render('index', { themes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar los temas');
    }
});

router.get('/song', async (req, res) => {
    try {
        const musicFolder = path.join(__dirname, '../assets/music/');
        const musics = await getFromFolder(musicFolder, 'All');
        const sortedMusic = musics.sort((a, b) => a.name.localeCompare(b.name));
        res.render('music', { musics: sortedMusic });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la música');
    }
});

router.get('/movie', async (req, res) => {
    res.render('movie');
});

router.get('/about', async (req, res) => {
    try {
        const videosFolder = path.join(__dirname, '../assets/videos/');
        const videos = await getVideosFromFolder(videosFolder);
        const sortedVideos = videos.sort((a, b) => a.name.localeCompare(b.name));
        res.render('about', { videos: sortedVideos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar los videos');
    }
});

router.get('/movie/category/:category', async (req, res) => {
    const category = req.params.category;
    try {
        const moviesFolder = path.join(__dirname, '../assets/movies/');
        const movies = await getFromFolder(moviesFolder, category);
        const sortedMovies = movies.sort((a, b) => a.name.localeCompare(b.name));
        res.render('category', { movies: sortedMovies });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar las películas por categoría');
    }
});

router.get('/play/movie/:id', async (req, res) => {
    const id = req.params.id;
    res.render('play', { id });
});

//Retorna Imagenes
router.get('/img/:imageName', (req, res) => {
    const imageName = path.basename(req.params.imageName); // Sanitize input
    const imgDirectory = path.join(__dirname, '../assets', 'img');

    fs.readdir(imgDirectory, (err, files) => {
        if (err) {
            console.error('Error reading image directory:', err);
            return res.status(500).send('Internal Server Error');
        }

        const matchingFile = files.find(file => file.toLowerCase().startsWith(imageName.toLowerCase()));

        if (matchingFile) {
            const imagePath = path.join(imgDirectory, matchingFile);
            res.sendFile(imagePath);
        } else {
            res.status(404).send('Image Not Found');
        }
    });
});

//Retorna Peliculas 
router.get('/movies/:category', async (req, res) => {
    const category = req.params.category;
    const moviesFolder = path.join(__dirname, '../assets/movies/');
    const movies = await getFromFolder(moviesFolder, category);
    const sortedMovies = movies.sort((a, b) => a.name.localeCompare(b.name));
    res.json(sortedMovies);
});

router.get('/videos', async (req, res) => {
    const videosFolder = path.join(__dirname, '../assets/videos/');
    const videos = await getVideosFromFolder(videosFolder);
    const sortedVideos = videos.sort((a, b) => a.name.localeCompare(b.name));
    res.json(sortedVideos);
});

// Ruta para obtener el listado de temas
router.get('/themes', async (req, res) => {
    const themeFolder = path.join(__dirname, '../assets/theme/');
    const themes = await getFilesFromFolder(themeFolder);
    res.json(themes);
});

router.get('/music', async (req, res) => {
    const musicFolder = path.join(__dirname, '../assets/music/');
    const music = await getFromFolder(musicFolder, 'All');
    const sortedMusic = music.sort((a, b) => a.name.localeCompare(b.name));
    res.json(sortedMusic);
});

router.get('/ads', async (req, res) => {
    const adsFolder = path.join(__dirname, '../assets/ads');
    const videoContent = await getRandomAd(adsFolder);
    if (videoContent) {
        res.set('Content-Type', 'video/mp4');
        res.send(videoContent);
    } else {
        res.status(404).send('No ad content available');
    }
});

router.get('/apk', (req, res) => {
    const apkFilePath = path.join(__dirname, '../assets', 'apk', 'veotrans.apk');

    fs.access(apkFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('El archivo APK no existe:', err);
            return res.status(404).send('APK Not Found');
        }

        res.sendFile(apkFilePath);
    });
});

router.get('/movie/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const moviesFolder = path.join(__dirname, '../assets/movies/');
    const movies = await getFromFolder(moviesFolder, 'all');
    const selectedMovie = movies.find(movie => movie.id === id);

    if (!selectedMovie) {
        return res.status(404).send('Movie Not Found');
    }

    const videoPath = selectedMovie.path;
    await serveVideoFile(videoPath, req, res);
});

router.get('/music/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const musicFolder = path.join(__dirname, '../assets/music/');
    const music = await getFromFolder(musicFolder, 'All');
    const selectedMusic = music.find(music => music.id === id);

    if (!selectedMusic) {
        return res.status(404).send('Music Not Found');
    }

    const musicPath = selectedMusic.path;
    await serveMusicFile(musicPath, req, res);
});

router.get('/video/:id', async (req, res) => {
    const id = req.params.id;
    const videosFolder = path.join(__dirname, '../assets/videos/');
    const video = await getVideoById(videosFolder, id);

    if (!video) {
        return res.status(404).send('Video Not Found');
    }

    const videoPath = video.path;
    await serveVideoFile(videoPath, req, res);
});

// Ruta para obtener el contenido de un tema específico por su ID
router.get('/theme/:id', async (req, res) => {
    const id = req.params.id;
    const themeFolder = path.join(__dirname, '../assets/theme/');
    const theme = await getFileById(themeFolder, id);

    if (!theme) {
        return res.status(404).send('Theme Not Found');
    }

    res.sendFile(theme.path);
});

module.exports = router;