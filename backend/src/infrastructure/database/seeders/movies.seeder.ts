import { DataSource, FindOptionsWhere, MoreThan, Repository } from 'typeorm';
import { Actor } from '../../../modules/movies/entities/actor.entity.js';
import { Cinema } from '../../../modules/locations/entities/cinema.entity.js';
import { Director } from '../../../modules/movies/entities/director.entity.js';
import { Format } from '../../../modules/movies/entities/format.entity.js';
import { Genre } from '../../../modules/movies/entities/genre.entity.js';
import { Language } from '../../../modules/movies/entities/language.entity.js';
import { Movie } from '../../../modules/movies/entities/movie.entity.js';
import { MovieActor } from '../../../modules/movies/entities/movie-actor.entity.js';
import { MovieFormat } from '../../../modules/movies/entities/movie-format.entity.js';
import { MovieFunction } from '../../../modules/movies/entities/movie-function.entity.js';
import { MovieGenre } from '../../../modules/movies/entities/movie-genre.entity.js';
import { MovieLanguage } from '../../../modules/movies/entities/movie-language.entity.js';
import { Room } from '../../../modules/movies/entities/room.entity.js';

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

function futureDate(days: number, hours: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, 0, 0, 0);
  return date;
}

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

interface MovieSeedRepos {
  directorRepo: Repository<Director>;
  genreRepo: Repository<Genre>;
  actorRepo: Repository<Actor>;
  languageRepo: Repository<Language>;
  formatRepo: Repository<Format>;
  movieRepo: Repository<Movie>;
  movieGenreRepo: Repository<MovieGenre>;
  movieActorRepo: Repository<MovieActor>;
  movieLanguageRepo: Repository<MovieLanguage>;
  movieFormatRepo: Repository<MovieFormat>;
  movieFunctionRepo: Repository<MovieFunction>;
  roomRepo: Repository<Room>;
}

interface MovieMetadataContext {
  directors: Map<string, Director>;
  genres: Map<string, Genre>;
  actors: Map<string, Actor>;
  languages: Map<string, Language>;
  formats: Map<string, Format>;
}

async function ensureNamedEntities<T extends { id: string; name: string }>(
  repo: Repository<T>,
  names: string[],
): Promise<Map<string, T>> {
  const uniqueNames = Array.from(new Set(names));
  const entities: T[] = await Promise.all(
    uniqueNames.map(async (name): Promise<T> => {
      const existing = await repo.findOne({ where: { name } as FindOptionsWhere<T> });
      if (existing) return existing;
      const created = repo.create({ name } as never);
      return (await repo.save(created)) as unknown as T;
    }),
  );
  return new Map<string, T>(entities.map((e) => [e.name, e]));
}

async function ensureRooms(roomRepo: Repository<Room>, cinemaId: string): Promise<Room[]> {
  const roomCount = await roomRepo.count({ where: { cinemaId } });
  if (roomCount === 0) {
    await roomRepo.save([
      roomRepo.create({ cinemaId, name: 'Sala 1', capacity: 50 }),
      roomRepo.create({ cinemaId, name: 'Sala 2', capacity: 40 }),
      roomRepo.create({ cinemaId, name: 'Sala IMAX', capacity: 40 }),
    ]);
  }
  return roomRepo.find({ where: { cinemaId }, order: { name: 'ASC' } });
}

async function seedMovieRelations(
  movie: Movie,
  seed: SeedMovie,
  metadata: MovieMetadataContext,
  repos: MovieSeedRepos,
): Promise<void> {
  const genreEntities = seed.genres
    .map((name) => metadata.genres.get(name))
    .filter((genre): genre is Genre => Boolean(genre))
    .map((genre) => repos.movieGenreRepo.create({ movieId: movie.id, genreId: genre.id }));

  const actorEntities = seed.actors
    .map((name) => metadata.actors.get(name))
    .filter((actor): actor is Actor => Boolean(actor))
    .map((actor) => repos.movieActorRepo.create({ movieId: movie.id, actorId: actor.id }));

  const languageEntities = seed.languages
    .map((name) => metadata.languages.get(name))
    .filter((language): language is Language => Boolean(language))
    .map((language) => repos.movieLanguageRepo.create({ movieId: movie.id, languageId: language.id }));

  const formatEntities = seed.formats
    .map((seedFormat) => {
      const format = metadata.formats.get(seedFormat.name);
      return format
        ? repos.movieFormatRepo.create({ movieId: movie.id, formatId: format.id, price: seedFormat.price })
        : null;
    })
    .filter((entry): entry is MovieFormat => entry !== null);

  await Promise.all([
    genreEntities.length > 0 ? repos.movieGenreRepo.save(genreEntities) : Promise.resolve(),
    actorEntities.length > 0 ? repos.movieActorRepo.save(actorEntities) : Promise.resolve(),
    languageEntities.length > 0 ? repos.movieLanguageRepo.save(languageEntities) : Promise.resolve(),
    formatEntities.length > 0 ? repos.movieFormatRepo.save(formatEntities) : Promise.resolve(),
  ]);
}

async function seedMovieFunctions(
  movie: Movie,
  seed: SeedMovie,
  cinemaId: string,
  availableRooms: Room[],
  formats: Map<string, Format>,
  movieFunctionRepo: Repository<MovieFunction>,
): Promise<void> {
  const futureCount = await movieFunctionRepo.count({
    where: { movieId: movie.id, isActive: true, startsAt: MoreThan(new Date()) },
  });
  if (futureCount > 0 || seed.functions.length === 0) return;

  const functionEntities = seed.functions
    .map((seedFunction, index) => {
      const format = formats.get(seedFunction.formatName);
      if (!format) return null;
      const room = availableRooms[index % availableRooms.length];
      return movieFunctionRepo.create({
        movieId: movie.id,
        cinemaId,
        roomId: room.id,
        formatId: format.id,
        startsAt: seedFunction.startsAt,
        ticketPrice: seedFunction.ticketPrice,
        totalSeats: seedFunction.totalSeats,
        availableSeats: seedFunction.availableSeats,
        isActive: true,
      });
    })
    .filter((entry): entry is MovieFunction => entry !== null);

  if (functionEntities.length > 0) {
    await movieFunctionRepo.save(functionEntities);
  }
}

async function seedSingleMovie(
  seed: SeedMovie,
  cinemaId: string,
  availableRooms: Room[],
  metadata: MovieMetadataContext,
  repos: MovieSeedRepos,
): Promise<void> {
  let movie = await repos.movieRepo.findOne({ where: { title: seed.title } });
  if (!movie) {
    const director = metadata.directors.get(seed.directorName);
    if (!director) return;

    movie = await repos.movieRepo.save(
      repos.movieRepo.create({
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

    await seedMovieRelations(movie, seed, metadata, repos);
  }

  await seedMovieFunctions(movie, seed, cinemaId, availableRooms, metadata.formats, repos.movieFunctionRepo);
}

export async function seedMovies(dataSource: DataSource): Promise<void> {
  const cinema = await dataSource.getRepository(Cinema).findOne({ where: { name: 'Cine Royal Medellín' } });
  if (!cinema) {
    throw new Error('El cine no existe. Ejecuta primero los seeders de ubicaciones.');
  }

  const repos: MovieSeedRepos = {
    directorRepo: dataSource.getRepository(Director),
    genreRepo: dataSource.getRepository(Genre),
    actorRepo: dataSource.getRepository(Actor),
    languageRepo: dataSource.getRepository(Language),
    formatRepo: dataSource.getRepository(Format),
    movieRepo: dataSource.getRepository(Movie),
    movieGenreRepo: dataSource.getRepository(MovieGenre),
    movieActorRepo: dataSource.getRepository(MovieActor),
    movieLanguageRepo: dataSource.getRepository(MovieLanguage),
    movieFormatRepo: dataSource.getRepository(MovieFormat),
    movieFunctionRepo: dataSource.getRepository(MovieFunction),
    roomRepo: dataSource.getRepository(Room),
  };

  const [availableRooms, directors, genres, actors, languages, formats] = await Promise.all([
    ensureRooms(repos.roomRepo, cinema.id),
    ensureNamedEntities(
      repos.directorRepo,
      MOVIES.map((m) => m.directorName),
    ),
    ensureNamedEntities(
      repos.genreRepo,
      MOVIES.flatMap((m) => m.genres),
    ),
    ensureNamedEntities(
      repos.actorRepo,
      MOVIES.flatMap((m) => m.actors),
    ),
    ensureNamedEntities(
      repos.languageRepo,
      MOVIES.flatMap((m) => m.languages),
    ),
    ensureNamedEntities(repos.formatRepo, ['2D', '3D', 'IMAX', 'VIP']),
  ]);

  const metadata: MovieMetadataContext = { directors, genres, actors, languages, formats };

  await Promise.all(MOVIES.map((seed) => seedSingleMovie(seed, cinema.id, availableRooms, metadata, repos)));
}
