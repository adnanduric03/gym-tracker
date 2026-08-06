import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import exerciseRoutes from './routes/exercises.js';
import workoutRoutes from './routes/workouts.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.get('/api/health', async (req, res) => {
  try{
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok',database: 'connected', time: new Date() });
  }catch(error){
    console.log('Greska s bazom: ', error)
    res.status(500).json({status:'error', database: 'disconnected'})
  }
  
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server radi na portu ${PORT}`));