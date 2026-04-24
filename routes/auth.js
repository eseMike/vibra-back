import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
   const authHeader = req.headers.authorization;

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({message: 'Token no proporcionado'});
   }

   const token = authHeader.split(' ')[1];

   try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vibra-secret-dev');
      req.user = decoded;
      next();
   } catch (err) {
      return res.status(401).json({message: 'Token inválido'});
   }
};

export const requireRole = (role) => {
   return (req, res, next) => {
      if (!req.user || req.user.role !== role) {
         return res.status(403).json({message: 'Acceso denegado por rol'});
      }
      next();
   };
};

router.post('/register', async (req, res) => {
   console.log('REQ BODY:', req.body);
   const {email, password, role} = req.body;

   if (!email || !password) {
      return res.status(400).json({message: 'Todos los campos son obligatorios'});
   }

   try {
      delete req.body.confirmPassword;
      const userExists = await User.findOne({email});
      if (userExists) {
         return res.status(409).json({message: 'El correo ya está registrado'});
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      console.log('CREATING USER WITH ROLE:', role);
      const newUser = new User({
         name: req.body.publicName || 'Nuevo usuario',
         email,
         password: hashedPassword,
         role: role === 'creator' ? 'creator' : 'user',
      });

      await newUser.save();

      const token = jwt.sign(
         {userId: newUser._id, email: newUser.email, role: newUser.role},
         process.env.JWT_SECRET || 'vibra-secret-dev',
         {expiresIn: '7d'}
      );

      res.status(201).json({
         message: 'Usuario creado correctamente',
         token,
         user: {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            isPremium: newUser.isPremium,
         },
      });
   } catch (err) {
      res.status(500).json({message: 'Error al registrar usuario', err});
   }
});

router.post('/login', async (req, res) => {
   const {email, password} = req.body;

   if (!email || !password) {
      return res.status(400).json({message: 'Todos los campos son obligatorios'});
   }

   try {
      const user = await User.findOne({email});

      if (!user) {
         return res.status(401).json({message: 'Usuario no encontrado'});
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
         return res.status(401).json({message: 'Contraseña incorrecta'});
      }

      const token = jwt.sign(
         {userId: user._id, email: user.email, role: user.role},
         process.env.JWT_SECRET || 'vibra-secret-dev',
         {expiresIn: '7d'}
      );

      res.json({
         message: 'Inicio de sesión exitoso 🎉',
         token,
         user: {
            id: user._id,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
         },
      });
   } catch (err) {
      res.status(500).json({message: 'Error en el servidor', err});
   }
});

router.get('/me', authMiddleware, async (req, res) => {
   try {
      const user = await User.findById(req.user.userId).select('-password');

      if (!user) {
         return res.status(404).json({message: 'Usuario no encontrado'});
      }

      res.json(user);
   } catch (err) {
      res.status(500).json({message: 'Error al obtener usuario', err});
   }
});

router.post('/activate-premium', authMiddleware, async (req, res) => {
   try {
      const user = await User.findById(req.user.userId);

      if (!user) {
         return res.status(404).json({message: 'Usuario no encontrado'});
      }

      user.isPremium = true;
      await user.save();

      res.json({
         message: 'Acceso premium activado',
         isPremium: user.isPremium,
      });
   } catch (err) {
      res.status(500).json({message: 'Error al activar premium', err});
   }
});

router.post('/become-creator', authMiddleware, async (req, res) => {
   try {
      const user = await User.findById(req.user.userId);

      if (!user) {
         return res.status(404).json({message: 'Usuario no encontrado'});
      }

      if (user.role === 'creator') {
         return res.status(400).json({message: 'Ya eres creador'});
      }

      user.role = 'creator';
      await user.save();

      // generar nuevo token con rol actualizado
      const token = jwt.sign(
         {userId: user._id, email: user.email, role: user.role},
         process.env.JWT_SECRET || 'vibra-secret-dev',
         {expiresIn: '7d'}
      );

      res.json({
         message: 'Ahora eres creador 🎬',
         token,
         user: {
            id: user._id,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
         },
      });
   } catch (err) {
      res.status(500).json({message: 'Error al convertir en creador', err});
   }
});

router.get('/creator-only', authMiddleware, requireRole('creator'), (req, res) => {
   res.json({
      message: 'Bienvenido creador 🎬',
      user: req.user,
   });
});

export default router;
