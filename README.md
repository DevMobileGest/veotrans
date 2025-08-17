# Streaming-v2

Una aplicación de video bajo demanda (VOD) y streaming basada en Node.js. Este proyecto sirve contenido multimedia (películas, música, videos, imágenes, anuncios y APKs) y proporciona una interfaz web para navegar y reproducir contenido.

## Características

*   Interfaz web para navegar por categorías de medios.
*   Transmisión de contenido de video y audio.
*   Servicio de imágenes, anuncios y archivos APK.
*   Carga dinámica de contenido desde carpetas locales de `assets`.
*   Arquitectura modular y asíncrona para un rendimiento mejorado.

## Tecnologías Utilizadas

*   Node.js
*   Express.js
*   EJS (Embedded JavaScript)
*   Fluent-FFmpeg (para la integración de FFmpeg)
*   Axios (para solicitudes HTTP, aunque en su mayoría reemplazadas por llamadas directas ahora)
*   CORS
*   Path (módulo incorporado de Node.js)
*   FS/FS.promises (módulo incorporado de Node.js para operaciones del sistema de archivos)

## Configuración/Instalación

Para poner en marcha este proyecto en su máquina local, siga estos pasos:

1.  **Clonar el repositorio:**
    ```bash
    git clone <url_del_repositorio>
    cd streaming-v2
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Preparar los activos multimedia:**
    Coloque sus archivos de video, música, imágenes y temas en los subdirectorios respectivos dentro de la carpeta `assets/`.
    *   `assets/movies/` (categorizados por subcarpetas A-G para géneros)
    *   `assets/music/`
    *   `assets/videos/`
    *   `assets/img/`
    *   `assets/theme/`
    *   `assets/ads/`
    *   `assets/apk/` (para `veotrans.apk`)

## Uso

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación normalmente se ejecutará en `http://localhost:3000` (o el puerto especificado en sus variables de entorno). Abra su navegador web y navegue a esta dirección para acceder a la aplicación.

## Estructura del Proyecto

El proyecto sigue una estructura modular:

*   `app.js`: Punto de entrada principal de la aplicación, maneja la configuración de middleware y rutas.
*   `routes/`: Contiene módulos de enrutador de Express para diferentes partes de la aplicación.
    *   `webRoutes.js`: Define todas las rutas orientadas a la web.
*   `helpers/`: Contiene funciones de utilidad y lógica de negocio.
    *   `mediaHelpers.js`: Funciones para interactuar con archivos y carpetas multimedia.
*   `public/`: Activos estáticos (CSS, JS del lado del cliente, etc.).
*   `views/`: Plantillas EJS para renderizar contenido dinámico.
*   `assets/`: Archivos multimedia (películas, música, imágenes, etc.).

## Mejoras Futuras

*   Implementar un middleware integral de manejo de errores.
*   Añadir una validación de entrada robusta para todos los parámetros proporcionados por el usuario.
*   Configurar CORS para restringir los orígenes en entornos de producción.
*   Integrar una biblioteca de registro dedicada.
*   Externalizar la configuración (por ejemplo, rutas de carpetas, mapeos de categorías).
*   Desarrollar un conjunto completo de pruebas (pruebas unitarias, de integración y de extremo a extremo).
*   Revisar y posiblemente eliminar dependencias de desarrollo no utilizadas (Webpack/Babel si no se utilizan por completo).
*   Mejorar la generación de ID para archivos multimedia.