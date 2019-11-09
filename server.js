'use strict';
// 3rd party dependencies
require('dotenv').config();
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const cors = require('cors');

// application constants
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// DB setup
const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => { throw err; });
// table name: location_table

// Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/location_table', tableHandler);
app.get('/yelp', yelpHandler);
app.get('', movieHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

///LOCATIONS
let locations = {};

function locationHandler(request,response) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  console.log(locations[url]);
  if ( locations[url] ) {
    response.send(locations[url]);
  }
  else {
    superagent.get(url)
      .then(data => {
        const geoData = data.body;
        const location = new Location(request.query.data, geoData);
        let latitude = location.latitude;
        let longitude = location.longitude;
        let place_id = location.place_id;
        let SQL = `INSERT INTO location_table (latitude, longitude, place_id) VALUES ($1, $2, $3) RETURNING *`;
        let safeValues = [latitude, longitude, place_id];
        client.query(SQL, safeValues).then( results => {
          response.status(200).send(results);
        }).catch( err => console.error(err));
        locations[url] = location;
        response.send(location);
      })
      .catch( () => {
        errorHandler(`So sorry, something went wrong. url: ${url}`, request, response);
      });
  }
}

function Location(query, geoData) {
  this.search_query = query;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
  this.place_id = geoData.results[0].place_id;
}

///WEATHER
function weatherHandler(request,response) {

  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then( data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch( () => {
      errorHandler(`So sorry, something went wrong. url: ${url}`, request, response);
    });
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}
///

///YELP
function yelpHandler(request,response) {

  const url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;

  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then( data => {
      const yelpReviews = data.body.businesses.map(business => {
        return new Yelp(business);
      });
      response.status(200).json(yelpReviews);
    })
    .catch( () => {
      errorHandler(`So sorry, something went wrong. url: ${url}`, request, response);
    });
}

function Yelp(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url;
}
///

///MOVIES
function movieHandler(request,response) {

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&language=en-US&query=${request.query.data}&page=1&include_adult=false`;

  superagent.get(url)
    .then( data => {
      const cityMovies = data.body.results.map(movie => {
        return new Movie(movie);
      });
      response.status(200).json(cityMovies);
    })
    .catch( () => {
      errorHandler(`So sorry, something went wrong. url: ${url}`, request, response);
    });
}

function Movie(movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.image_url = movie.poster_path;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
}
///

///STORAGE
function tableHandler(req, res) {
  let SQL = `SELECT * FROM location_table`;
  client.query(SQL)
    .then( results => {
      res.status(200).json(results.rows);
    })
    .catch( err => console.err(err));
}
///

function notFoundHandler(request,response) {
  response.status(404).send('huh?');
}

function errorHandler(error,request,response) {
  response.status(500).send(error);
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })
  .catch(err => {
    throw `PG startup error ${err.message}`
  })
