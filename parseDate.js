// const fs = require('fs');
import fs from 'fs';
import { pokemons } from './public/data/data.js'

const input = pokemons; // Assuming the JSON data is stored in a variable called 'pokemonData'

const output = {
    data: input.map((pokemon, index) => ({
        id: index + 1,
        name: pokemon.Name.toLowerCase(),
        types: [pokemon.Type1.toLowerCase(), pokemon.Type2.toLowerCase()],
        url: `./pokemon/${index + 1}.png`
    })),
    totalPokemons: input.length
};

// Write to JSON file
fs.writeFileSync('pokemons.json', JSON.stringify(output, null, 2), 'utf-8');

console.log('Data written to pokemons.json');
