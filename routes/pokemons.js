import express from 'express';
import data from '../public/data/pokemons.json' with { type: 'json' };

const router = express.Router();

// Các Pokémon type hợp lệ theo đề
const VALID_TYPES = [
  'bug',
  'dragon',
  'fairy',
  'fire',
  'ghost',
  'ground',
  'normal',
  'psychic',
  'steel',
  'dark',
  'electric',
  'fighting',
  'flying',
  'grass',
  'ice',
  'poison',
  'rock',
  'water'
];

// Dataset có 809 Pokémon.
// Chỉ giữ Pokémon từ 1 -> 721 vì dataset ảnh có 721 ảnh.
let pokemons = data.data
  .filter((pokemon) => pokemon.id >= 1 && pokemon.id <= 721)
  .map((pokemon) => enrichPokemon(pokemon));


// ==================================================
// HELPER FUNCTIONS
// ==================================================

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}


// ==================================================
// ENRICH POKÉMON
// ==================================================

function enrichPokemon(pokemon) {
  const types = Array.isArray(pokemon.types)
    ? pokemon.types
        .filter(Boolean)
        .slice(0, 2)
    : [];

  const primaryType = types[0] || 'normal';

  const id = Number(pokemon.id);

  // Dữ liệu được generate dựa trên ID
  const height = ((id * 7) % 40 + 10) / 10;
  const weight = ((id * 37) % 900 + 100) / 10;

  return {
    id: id,

    name: pokemon.name,

    description:
      `${capitalize(pokemon.name)} is a ` +
      `${types.map(capitalize).join(' and ')} type Pokémon. ` +
      `This description was generated for CoderDex.`,

    height: `${height.toFixed(1)} m`,

    weight: `${weight.toFixed(1)} kg`,

    category: `${capitalize(primaryType)} Pokémon`,

    abilities: [
      `${capitalize(primaryType)} Power`,
      types[1]
        ? `${capitalize(types[1])} Guard`
        : 'Natural Ability'
    ],

    types: types,

    url: `http://localhost:5000/images/${id}.png`
  };
}


// ==================================================
// VALIDATE POKÉMON
// ==================================================

function validatePokemon(body) {
  if (!body || typeof body !== 'object') {
    return 'Missing required data.';
  }

  // Required data
  if (
    body.name === undefined ||
    body.id === undefined ||
    body.types === undefined ||
    body.url === undefined
  ) {
    return 'Missing required data.';
  }

  // Types phải là array
  if (!Array.isArray(body.types)) {
    return 'Pokémon can only have one or two types.';
  }

  // Chỉ được 1 hoặc 2 type
  if (
    body.types.length < 1 ||
    body.types.length > 2
  ) {
    return 'Pokémon can only have one or two types.';
  }

  // Kiểm tra type hợp lệ
  const invalidType = body.types.some(
    (type) =>
      typeof type !== 'string' ||
      !VALID_TYPES.includes(type.toLowerCase())
  );

  if (invalidType) {
    return "Pokémon's type is invalid.";
  }

  return null;
}


// ==================================================
// GET ALL POKÉMON
// ==================================================

// GET /pokemons
// GET /pokemons?name=pika
// GET /pokemons?search=pika
// GET /pokemons?type=fire
// GET /pokemons?page=2&limit=20

router.get('/', function (req, res) {
  let result = [...pokemons];

  const {
    name,
    search,
    type,
    page,
    limit
  } = req.query;


  // ==================================================
  // SEARCH BY NAME
  // ==================================================

  // Hỗ trợ cả name và search
  const searchValue = search || name;

  if (searchValue) {
    const searchName = String(searchValue)
      .trim()
      .toLowerCase();

    result = result.filter((pokemon) =>
      pokemon.name
        .toLowerCase()
        .includes(searchName)
    );
  }


  // ==================================================
  // FILTER BY TYPE
  // ==================================================

  if (type) {
    const searchType = String(type)
      .trim()
      .toLowerCase();

    result = result.filter((pokemon) =>
      pokemon.types.includes(searchType)
    );
  }


  // ==================================================
  // TOTAL
  // ==================================================

  const totalPokemons = result.length;


  // ==================================================
  // PAGINATION
  // ==================================================

  if (
    page !== undefined ||
    limit !== undefined
  ) {
    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const perPage = Math.max(
      Number(limit) || 20,
      1
    );

    const start =
      (currentPage - 1) * perPage;

    const end =
      start + perPage;

    result = result.slice(start, end);
  }


  // ==================================================
  // RESPONSE
  // ==================================================

  res.json({
    data: result,
    totalPokemons: totalPokemons
  });
});


// ==================================================
// GET ONE POKÉMON
// ==================================================

// GET /pokemons/:id

router.get('/:id', function (req, res) {
  const id = Number(req.params.id);


  // ==================================================
  // VALIDATE ID
  // ==================================================

  if (!Number.isInteger(id)) {
    return res.status(404).json({
      message: 'Pokémon not found.'
    });
  }


  // ==================================================
  // FIND POKÉMON
  // ==================================================

  const currentIndex = pokemons.findIndex(
    (pokemon) => pokemon.id === id
  );


  // Không tìm thấy
  if (currentIndex === -1) {
    return res.status(404).json({
      message: 'Pokémon not found.'
    });
  }


  // ==================================================
  // CURRENT POKÉMON
  // ==================================================

  const pokemon = pokemons[currentIndex];


  // ==================================================
  // PREVIOUS POKÉMON
  // ==================================================

  const previousPokemon =
    currentIndex > 0
      ? pokemons[currentIndex - 1]
      : null;


  // ==================================================
  // NEXT POKÉMON
  // ==================================================

  const nextPokemon =
    currentIndex < pokemons.length - 1
      ? pokemons[currentIndex + 1]
      : null;


  // ==================================================
  // RESPONSE
  // ==================================================

  res.json({
    pokemon: pokemon,
    previousPokemon: previousPokemon,
    nextPokemon: nextPokemon
  });
});


// ==================================================
// CREATE POKÉMON
// ==================================================

// POST /pokemons

router.post('/', function (req, res) {
  const error = validatePokemon(req.body);

  if (error) {
    return res.status(400).json({
      message: error
    });
  }


  // ==================================================
  // DATA
  // ==================================================

  const id = Number(req.body.id);

  const name = String(req.body.name)
    .trim()
    .toLowerCase();


  // ==================================================
  // VALIDATE ID + NAME
  // ==================================================

  if (
    !Number.isInteger(id) ||
    !name
  ) {
    return res.status(400).json({
      message: 'Missing required data.'
    });
  }


  // ==================================================
  // CHECK DUPLICATE
  // ==================================================

  const exists = pokemons.some(
    (pokemon) =>
      pokemon.id === id ||
      pokemon.name.toLowerCase() === name
  );


  if (exists) {
    return res.status(409).json({
      message: 'The Pokémon already exists.'
    });
  }


  // ==================================================
  // CREATE
  // ==================================================

  const pokemon = enrichPokemon({
    id: id,
    name: name,
    types: req.body.types,
    url: req.body.url
  });


  // ==================================================
  // KEEP CUSTOM DATA
  // ==================================================

  if (req.body.description !== undefined) {
    pokemon.description =
      req.body.description;
  }

  if (req.body.height !== undefined) {
    pokemon.height =
      req.body.height;
  }

  if (req.body.weight !== undefined) {
    pokemon.weight =
      req.body.weight;
  }

  if (req.body.category !== undefined) {
    pokemon.category =
      req.body.category;
  }

  if (req.body.abilities !== undefined) {
    pokemon.abilities =
      req.body.abilities;
  }

  if (req.body.url !== undefined) {
    pokemon.url =
      req.body.url;
  }


  // ==================================================
  // ADD TO ARRAY
  // ==================================================

  pokemons.push(pokemon);


  // Sort by ID
  pokemons.sort(
    (a, b) => a.id - b.id
  );


  // ==================================================
  // RESPONSE
  // ==================================================

  res.status(201).json({
    pokemon: pokemon
  });
});


// ==================================================
// UPDATE POKÉMON
// ==================================================

// PUT /pokemons/:id

router.put('/:id', function (req, res) {
  const id = Number(req.params.id);


  // ==================================================
  // FIND POKÉMON
  // ==================================================

  const index = pokemons.findIndex(
    (pokemon) => pokemon.id === id
  );


  if (index === -1) {
    return res.status(404).json({
      message: 'Pokémon not found.'
    });
  }


  // ==================================================
  // UPDATE DATA
  // ==================================================

  const updated = {
    ...pokemons[index],
    ...req.body,

    // ID trong URL là ID chính
    id: id,

    name:
      req.body.name !== undefined
        ? String(req.body.name)
            .trim()
            .toLowerCase()
        : pokemons[index].name
  };


  // ==================================================
  // VALIDATE
  // ==================================================

  const error =
    validatePokemon(updated);

  if (error) {
    return res.status(400).json({
      message: error
    });
  }


  // ==================================================
  // CHECK DUPLICATE
  // ==================================================

  const duplicate = pokemons.some(
    (pokemon, pokemonIndex) =>
      pokemonIndex !== index &&
      (
        pokemon.id === id ||
        pokemon.name.toLowerCase() ===
          updated.name
      )
  );


  if (duplicate) {
    return res.status(409).json({
      message: 'The Pokémon already exists.'
    });
  }


  // ==================================================
  // ENRICH UPDATED POKÉMON
  // ==================================================

  pokemons[index] =
    enrichPokemon(updated);


  // ==================================================
  // KEEP CUSTOM DATA
  // ==================================================

  pokemons[index].description =
    updated.description;

  pokemons[index].height =
    updated.height;

  pokemons[index].weight =
    updated.weight;

  pokemons[index].category =
    updated.category;

  pokemons[index].abilities =
    updated.abilities;

  pokemons[index].url =
    updated.url;


  // ==================================================
  // RESPONSE
  // ==================================================

  res.json({
    pokemon: pokemons[index]
  });
});


// ==================================================
// DELETE POKÉMON
// ==================================================

// DELETE /pokemons/:id

router.delete('/:id', function (req, res) {
  const id = Number(req.params.id);


  // ==================================================
  // FIND POKÉMON
  // ==================================================

  const index = pokemons.findIndex(
    (pokemon) => pokemon.id === id
  );


  if (index === -1) {
    return res.status(404).json({
      message: 'Pokémon not found.'
    });
  }


  // ==================================================
  // DELETE
  // ==================================================

  const deletedPokemon =
    pokemons.splice(index, 1)[0];


  // ==================================================
  // RESPONSE
  // ==================================================

  res.json({
    pokemon: deletedPokemon
  });
});


// ==================================================
// EXPORT
// ==================================================

export default router;