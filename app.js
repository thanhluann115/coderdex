import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import createError from 'http-errors';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import pokemonsRouter from './routes/pokemons.js';
import cors from 'cors';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// Cho phép Front-end truy cập hình Pokémon
app.use(
  '/images',
  express.static(path.join(process.cwd(), 'public/pokemon'))
);

app.use(
  '/pokemon',
  express.static(path.join(process.cwd(), 'public/pokemon'))
);

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/pokemons', pokemonsRouter);

// 404
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.'
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});