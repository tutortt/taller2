//Importaciones de los módulos 
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import cors from 'cors';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configurar Multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${unique}.${ext}`);
  }
});
const upload = multer({ storage });

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error al conectar MongoDB:', err));

// RUTAS

// 1. Registro
app.post('/api/registro', upload.single('imagenPerfil'), async (req, res) => {
  try {
    const { nombre, correo, edad } = req.body;
    const imagenPerfil = req.file?.path || null;

    if (!imagenPerfil) {
      return res.status(400).json({ error: 'Debes subir una imagen de perfil' });
    }

    const nuevoUsuario = new User({ nombre, correo, edad, imagenPerfil });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuario: nuevoUsuario });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

// 2. Listar todos los usuarios
app.get('/api/usuarios', async (_, res) => {
  try {
    const usuarios = await User.find().select('-__v');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// 3. Obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select('-__v');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: 'ID inválido' });
  }
});

// 4. Editar usuario (PATCH)
app.patch('/api/usuarios/:id', upload.single('imagenPerfil'), async (req, res) => {
  try {
    const { nombre, correo, edad } = req.body;
    const update = { nombre, correo, edad };
    if (req.file) update.imagenPerfil = req.file.path;

    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario actualizado', usuario });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

// 5. Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await User.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(400).json({ error: 'ID inválido' });
  }
});

// 6. Buscar usuarios (por nombre o correo, insensible a mayúsculas)
app.get('/api/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Parámetro q requerido' });

    const regex = new RegExp(q, 'i');
    const usuarios = await User.find({
      $or: [{ nombre: regex }, { correo: regex }]
    }).select('-__v');

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar usuarios' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
```