import express from 'express';
import multer from 'multer';
import path from 'path';
import Content from '../models/Content.js';
import {authMiddleware} from './auth.js';

const router = express.Router();

// Configuración de almacenamiento
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, 'uploads/');
   },
   filename: function (req, file, cb) {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
   },
});

// Filtro de archivos (opcional)
const fileFilter = (req, file, cb) => {
   const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];

   if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
   } else {
      cb(new Error('Tipo de archivo no permitido'), false);
   }
};

const upload = multer({storage, fileFilter});

// Endpoint upload
router.post(
   '/upload',
   authMiddleware,
   upload.fields([
      {name: 'images', maxCount: 10},
      {name: 'video', maxCount: 1},
   ]),
   async (req, res) => {
      try {
         const {title, description, type} = req.body;

         const images = req.files['images'] || [];
         const video = req.files['video'] ? req.files['video'][0] : null;

         // Mapear paths de archivos
         const imagePaths = images.map((img) => img.path);
         const videoPath = video ? video.path : '';

         // Obtener userId desde el token (authMiddleware debe haberlo agregado)
         const userId = req.user?.userId;

         // Crear documento en MongoDB
         const newContent = new Content({
            title,
            description,
            contentType: type,
            images: imagePaths,
            video: videoPath,
            userId,
         });

         const savedContent = await newContent.save();

         res.json({
            message: 'Contenido guardado en DB 🚀',
            data: savedContent,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({message: 'Error al subir contenido'});
      }
   }
);

/**
 * Obtener todos los contenidos
 */
router.get('/', async (req, res) => {
   try {
      const contents = await Content.find().sort({createdAt: -1});

      res.json({
         message: 'Contenido obtenido correctamente',
         data: contents,
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({message: 'Error al obtener contenido'});
   }
});

export default router;
