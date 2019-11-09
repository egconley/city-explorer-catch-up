# ellens-weekend-city-explorer

```
function trailsHandler(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;
  superagent.get(url)
    .set('Authorization', `Bearer ${API_KEY}`)
    .then(data => {
      const trailData = data.body.trails.map(location => {
        return new Trail(location);
      });
      response.status(200).json(trailData);
    })
    .catch(error => errorHandler(error, request, response));
}
```
