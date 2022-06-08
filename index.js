const express = require('express');
morgan = require('morgan');
fs = require('fs'), // import built in node modules fs and path
    path = require('path');

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })

let topMovies = [
    {
        title: 'Iron Man',
        phase: '1'
    },
    {
        title: 'The Incredible Hulk',
        phase: '1'
    },
    {
        title: 'Iron Man 2',
        phase: '1'
    },
    {
        title: 'Thor',
        phase: '1'
    },
    {
        title: 'Captain America: The First Avenger',
        phase: '1'
    },
    {
        title: 'Marvel\'s The Avengers',
        phase: '1'
    },
    {
        title: 'Iron Man 3',
        phase: '2'
    },
    {
        title: 'Thor: The Dark World',
        phase: '2'
    },
    {
        title: 'Captain America: The Winter Soldier',
        phase: '2'
    },
    {
        title: 'Guardians of the Galaxy',
        phase: '2'
    }
]

app.get('/', (req, res) => {
    res.send('Welcome to information on Marvel movies');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Oops, something broke!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});