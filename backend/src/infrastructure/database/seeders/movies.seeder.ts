import { DataSource, FindOptionsWhere, MoreThan, Repository } from 'typeorm';
import { Actor } from '../../../modules/movies/domain/entities/actor.entity.js';
import { Cinema } from '../../../modules/locations/domain/entities/cinema.entity.js';
import { Director } from '../../../modules/movies/domain/entities/director.entity.js';
import { Format } from '../../../modules/movies/domain/entities/format.entity.js';
import { Genre } from '../../../modules/movies/domain/entities/genre.entity.js';
import { Language } from '../../../modules/movies/domain/entities/language.entity.js';
import { Movie } from '../../../modules/movies/domain/entities/movie.entity.js';
import { MovieActor } from '../../../modules/movies/domain/entities/movie-actor.entity.js';
import { MovieFormat } from '../../../modules/movies/domain/entities/movie-format.entity.js';
import { MovieFunction } from '../../../modules/movies/domain/entities/movie-function.entity.js';
import { MovieGenre } from '../../../modules/movies/domain/entities/movie-genre.entity.js';
import { MovieLanguage } from '../../../modules/movies/domain/entities/movie-language.entity.js';
import { Room } from '../../../modules/movies/domain/entities/room.entity.js';

const TRAILERS = {
  oppenheimer: 'https://www.youtube.com/embed/d9MyW72ELq0',
  dune2: 'https://www.youtube.com/embed/Way9Dexny3w',
  interstellar: 'https://www.youtube.com/embed/zSWdZVtXT7E',
  barbie: 'https://www.youtube.com/embed/pBk4NYhWNMM',
};

type SeedFunction = {
  startsAt: Date;
  formatName: string;
  ticketPrice: number;
  availableSeats: number;
  totalSeats: number;
};

type SeedFormat = {
  name: string;
  price: number;
};

type SeedMovie = {
  title: string;
  posterUrl: string;
  bannerUrl: string;
  trailerUrl: string;
  synopsis: string;
  durationMinutes: number;
  classification: string;
  releaseDate: string;
  rating: number;
  directorName: string;
  genres: string[];
  actors: string[];
  languages: string[];
  formats: SeedFormat[];
  functions: SeedFunction[];
};

const MOVIES: SeedMovie[] = [
  {
    title: 'Oppenheimer',
    posterUrl: 'https://cdn.example.com/posters/oppenheimer.jpg',
    bannerUrl: 'https://cdn.example.com/banners/oppenheimer.jpg',
    trailerUrl: TRAILERS.oppenheimer,
    synopsis: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.',
    durationMinutes: 180,
    classification: 'B',
    releaseDate: '2023-07-21',
    rating: 8.6,
    directorName: 'Christopher Nolan',
    genres: ['Drama', 'Historia'],
    actors: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'],
    languages: ['Español', 'Inglés'],
    formats: [
      { name: '2D', price: 18000 },
      { name: 'IMAX', price: 28000 },
    ],
    functions: [
      {
        startsAt: futureDate(1, 3),
        formatName: '2D',
        ticketPrice: 18000,
        availableSeats: 40,
        totalSeats: 50,
      },
      {
        startsAt: futureDate(1, 6),
        formatName: 'IMAX',
        ticketPrice: 28000,
        availableSeats: 0,
        totalSeats: 40,
      },
    ],
  },
  {
    title: 'Dune: Parte Dos',
    posterUrl: 'https://cdn.example.com/posters/dune-2.jpg',
    bannerUrl: 'https://cdn.example.com/banners/dune-2.jpg',
    trailerUrl: TRAILERS.dune2,
    synopsis: 'Paul Atreides se une a los Fremen para vengarse de los conspiradores que destruyeron a su familia.',
    durationMinutes: 166,
    classification: 'B',
    releaseDate: '2024-02-29',
    rating: 8.4,
    directorName: 'Denis Villeneuve',
    genres: ['Acción', 'Aventura', 'Ciencia Ficción'],
    actors: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
    languages: ['Español', 'Inglés'],
    formats: [
      { name: '2D', price: 20000 },
      { name: '3D', price: 24000 },
      { name: 'IMAX', price: 30000 },
    ],
    functions: [
      {
        startsAt: futureDate(2, 5),
        formatName: '2D',
        ticketPrice: 20000,
        availableSeats: 25,
        totalSeats: 50,
      },
    ],
  },
  {
    title: 'Interestelar',
    posterUrl: 'https://cdn.example.com/posters/interstellar.jpg',
    bannerUrl: 'https://cdn.example.com/banners/interstellar.jpg',
    trailerUrl: TRAILERS.interstellar,
    synopsis:
      'Un grupo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad.',
    durationMinutes: 169,
    classification: 'A',
    releaseDate: '2014-11-07',
    rating: 8.7,
    directorName: 'Christopher Nolan',
    genres: ['Ciencia Ficción', 'Drama'],
    actors: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    languages: ['Español', 'Inglés'],
    formats: [
      { name: '2D', price: 15000 },
      { name: 'IMAX', price: 26000 },
    ],
    functions: [],
  },
  {
    title: 'Barbie',
    posterUrl: 'https://cdn.example.com/posters/barbie.jpg',
    bannerUrl: 'https://cdn.example.com/banners/barbie.jpg',
    trailerUrl: TRAILERS.barbie,
    synopsis: 'Barbie vive en Barbieland y emprende un viaje al mundo real tras una crisis existencial.',
    durationMinutes: 114,
    classification: 'A',
    releaseDate: '2023-07-20',
    rating: 7.0,
    directorName: 'Greta Gerwig',
    genres: ['Comedia', 'Aventura'],
    actors: ['Margot Robbie', 'Ryan Gosling'],
    languages: ['Español', 'Inglés'],
    formats: [
      { name: '2D', price: 16000 },
      { name: '3D', price: 20000 },
    ],
    functions: [
      {
        startsAt: futureDate(1, 4),
        formatName: '2D',
        ticketPrice: 16000,
        availableSeats: 12,
        totalSeats: 50,
      },
    ],
  },
];

function futureDate(days: number, hours: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, 0, 0, 0);
  return date;
}

export async function seedMovies(dataSource: DataSource): Promise<void> {
  const directorRepo = dataSource.getRepository(Director);
  const genreRepo = dataSource.getRepository(Genre);
  const actorRepo = dataSource.getRepository(Actor);
  const languageRepo = dataSource.getRepository(Language);
  const formatRepo = dataSource.getRepository(Format);
  const movieRepo = dataSource.getRepository(Movie);
  const movieGenreRepo = dataSource.getRepository(MovieGenre);
  const movieActorRepo = dataSource.getRepository(MovieActor);
  const movieLanguageRepo = dataSource.getRepository(MovieLanguage);
  const movieFormatRepo = dataSource.getRepository(MovieFormat);
  const movieFunctionRepo = dataSource.getRepository(MovieFunction);
  const roomRepo = dataSource.getRepository(Room);

  const cinema = await dataSource.getRepository(Cinema).findOne({ where: { name: 'Cine Royal Medellín' } });
  if (!cinema) {
    throw new Error('El cine no existe. Ejecuta primero los seeders de ubicaciones.');
  }

  const rooms = await roomRepo.count({ where: { cinemaId: cinema.id } });
  if (rooms === 0) {
    await roomRepo.save([
      roomRepo.create({ cinemaId: cinema.id, name: 'Sala 1', capacity: 50 }),
      roomRepo.create({ cinemaId: cinema.id, name: 'Sala 2', capacity: 40 }),
      roomRepo.create({ cinemaId: cinema.id, name: 'Sala IMAX', capacity: 40 }),
    ]);
  }
  const availableRooms = await roomRepo.find({ where: { cinemaId: cinema.id }, order: { name: 'ASC' } });

  const getOrCreate = async <T extends { name: string }>(
    repo: Repository<T>,
    name: string,
    create: () => T,
  ): Promise<T> => {
    const existing = await repo.findOne({ where: { name } as FindOptionsWhere<T> });
    return existing ?? (await repo.save(create()));
  };

  const formats = new Map<string, Format>();
  for (const formatName of ['2D', '3D', 'IMAX', 'VIP']) {
    formats.set(formatName, await getOrCreate(formatRepo, formatName, () => formatRepo.create({ name: formatName })));
  }

  for (const seed of MOVIES) {
    let movie = await movieRepo.findOne({ where: { title: seed.title } });
    if (!movie) {
      const director = await getOrCreate(directorRepo, seed.directorName, () =>
        directorRepo.create({ name: seed.directorName }),
      );

      movie = await movieRepo.save(
        movieRepo.create({
          title: seed.title,
          posterUrl: seed.posterUrl,
          bannerUrl: seed.bannerUrl,
          trailerUrl: seed.trailerUrl,
          synopsis: seed.synopsis,
          durationMinutes: seed.durationMinutes,
          classification: seed.classification,
          releaseDate: new Date(seed.releaseDate),
          rating: seed.rating,
          directorId: director.id,
          isActive: true,
        }),
      );

      for (const genreName of seed.genres) {
        const genre = await getOrCreate(genreRepo, genreName, () => genreRepo.create({ name: genreName }));
        await movieGenreRepo.save(movieGenreRepo.create({ movieId: movie.id, genreId: genre.id }));
      }

      for (const actorName of seed.actors) {
        const actor = await getOrCreate(actorRepo, actorName, () => actorRepo.create({ name: actorName }));
        await movieActorRepo.save(movieActorRepo.create({ movieId: movie.id, actorId: actor.id }));
      }

      for (const languageName of seed.languages) {
        const language = await getOrCreate(languageRepo, languageName, () =>
          languageRepo.create({ name: languageName }),
        );
        await movieLanguageRepo.save(movieLanguageRepo.create({ movieId: movie.id, languageId: language.id }));
      }

      for (const seedFormat of seed.formats) {
        const format = formats.get(seedFormat.name);
        if (!format) continue;
        await movieFormatRepo.save(
          movieFormatRepo.create({ movieId: movie.id, formatId: format.id, price: seedFormat.price }),
        );
      }
    }

    const futureCount = await movieFunctionRepo.count({
      where: { movieId: movie.id, isActive: true, startsAt: MoreThan(new Date()) },
    });
    if (futureCount === 0 && seed.functions.length > 0) {
      for (const seedFunction of seed.functions) {
        const format = formats.get(seedFunction.formatName);
        if (!format) continue;
        const room = availableRooms[seed.functions.indexOf(seedFunction) % availableRooms.length];
        await movieFunctionRepo.save(
          movieFunctionRepo.create({
            movieId: movie.id,
            cinemaId: cinema.id,
            roomId: room.id,
            formatId: format.id,
            startsAt: seedFunction.startsAt,
            ticketPrice: seedFunction.ticketPrice,
            totalSeats: seedFunction.totalSeats,
            availableSeats: seedFunction.availableSeats,
            isActive: true,
          }),
        );
      }
    }
  }
}
