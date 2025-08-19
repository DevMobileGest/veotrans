const express = require('express');
const cors = require('cors');
const path = require('path');
const { default: axios } = require('axios'); // axios is still used in some places, like the /img route
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

const {
    getVideoById,
    getFromFolder,
    getFileById,
    getRandomAd,
    getVideosFromFolder,
    serveVideoFile,
    serveMusicFile,
    getFilesFromFolder
} = require('./helpers/mediaHelpers');

ffmpeg.setFfmpegPath(ffmpegStatic);

const PORT = process.env.PORT || 80;
const BASE_URL = `http://0.0.0.0:${PORT}`;

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

// Web

app.get('/', async (req, res) => {
    try {
        const themeFolder = path.join(__dirname, '/assets/theme/');
        const themes = await getFilesFromFolder(themeFolder); // Directly call the helper function
        res.render('index', { themes }); // Pass themes to the template if needed
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar los temas'); // More specific error message
    }
});

app.get('/song', async (req, res) => {
    try {
        const musicFolder = path.join(__dirname, '/assets/music/');
        const musics = await getFromFolder(musicFolder, 'All');
        const sortedMusic = musics.sort((a, b) => a.name.localeCompare(b.name)); // Sorting logic from /music endpoint
        res.render('music', { musics: sortedMusic });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la música');
    }
});

app.get('/movie', async (req, res) => {
    res.render('movie');
});

app.get('/about', async (req, res) => {
    try {
        const videosFolder = path.join(__dirname, '/assets/videos/');
        const videos = await getVideosFromFolder(videosFolder);
        const sortedVideos = videos.sort((a, b) => a.name.localeCompare(b.name)); // Sorting logic from /videos endpoint
        res.render('about', { videos: sortedVideos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar los videos');
    }
});

app.get('/movie/category/:category', async (req, res) => {
    const category = req.params.category;
    try {
        const moviesFolder = path.join(__dirname, '/assets/movies/');
        const movies = await getFromFolder(moviesFolder, category);
        const sortedMovies = movies.sort((a, b) => a.name.localeCompare(b.name)); // Sorting logic from /movies/:category endpoint
        res.render('category', { movies: sortedMovies });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar las películas por categoría');
    }
});

app.get('/play/movie/:id', async (req, res) => {
    const id = req.params.id;

    res.render('play', { id });

});





//Retorna Peliculas 

app.get('/movies/:category', async (req, res) => {
    const category = req.params.category;
    const moviesFolder = path.join(__dirname, '/assets/movies/');
    const movies = await getFromFolder(moviesFolder, category);
    const sortedMovies = movies.sort((a, b) => a.name.localeCompare(b.name));
    res.json(sortedMovies);
});

app.get('/videos', async (req, res) => {
    const videosFolder = path.join(__dirname, '/assets/videos/');
    const videos = await getVideosFromFolder(videosFolder);
    const sortedVideos = videos.sort((a, b) => a.name.localeCompare(b.name));
    res.json(sortedVideos);
});

// Ruta para obtener el listado de temas
app.get('/themes', async (req, res) => {
    const themeFolder = path.join(__dirname, '/assets/theme/');
    const themes = await getFilesFromFolder(themeFolder);
    res.json(themes);
});

app.get('/music', async (req, res) => {
    const musicFolder = path.join(__dirname, '/assets/music/');
    const music = await getFromFolder(musicFolder, 'All');
    const sortedMusic = music.sort((a, b) => a.name.localeCompare(b.name));
    res.json(sortedMusic);
});


app.get('/ads', async (req, res) => {
    const adsFolder = path.join(__dirname, '/assets/ads');
    const videoContent = await getRandomAd(adsFolder);
    if (videoContent) {
        res.set('Content-Type', 'video/mp4'); // Establece el tipo de contenido del video
        res.send(videoContent);
    } else {
        res.status(404).send('No ad content available');
    }
})

app.get('/apk', (req, res) => {
    const apkFilePath = path.join(__dirname, 'assets', 'apk', 'veotrans.apk');

    // Verificar si el archivo existe
    fs.access(apkFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('El archivo APK no existe:', err);
            return res.status(404).send('APK Not Found');
        }

        // Enviar el archivo APK
        res.sendFile(apkFilePath);
    });
});

app.get('/movie/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const moviesFolder = path.join(__dirname, '/assets/movies/');
    const movies = await getFromFolder(moviesFolder, 'all'); // Obtener todas las películas
    const selectedMovie = movies.find(movie => movie.id === id);

    if (!selectedMovie) {
        return res.status(404).send('Movie Not Found');
    }

    const videoPath = selectedMovie.path;

    await serveVideoFile(videoPath, req, res)
});

app.get('/music/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const musicFolder = path.join(__dirname, '/assets/music/');
    const music = await getFromFolder(musicFolder, 'All');
    const selectedMusic = music.find(music => music.id === id);

    if (!selectedMusic) {
        return res.status(404).send('Music Not Found');
    }

    const musicPath = selectedMusic.path;

    await serveMusicFile(musicPath, req, res);
});

app.get('/video/:id', async (req, res) => {
    const id = req.params.id;
    const videosFolder = path.join(__dirname, '/assets/videos/');
    const video = await getVideoById(videosFolder, id);

    if (!video) {
        return res.status(404).send('Video Not Found');
    }

    const videoPath = video.path;
    await serveVideoFile(videoPath, req, res)
});

// Ruta para obtener el contenido de un tema específico por su ID
app.get('/theme/:id', (req, res) => {
    const id = req.params.id;
    const themeFolder = path.join(__dirname, '/assets/theme/');
    const theme = getFileById(themeFolder, id);

    if (!theme) {
        return res.status(404).send('Theme Not Found');
    }

    // Aquí servirías el contenido del tema según su tipo
    // Por ejemplo, si es un video, puedes usar res.sendFile() para enviar el archivo
    res.sendFile(theme.path);
});




const webRoutes = require('./routes/webRoutes');
app.use('/', webRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});





