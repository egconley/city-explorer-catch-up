DROP TABLE IF EXISTS location_table;

CREATE TABLE location_table (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    place_id VARCHAR(255)
);

DROP TABLE IF EXISTS weather_table;

CREATE TABLE weather_table (
    id SERIAL PRIMARY KEY,
    global_search_query VARCHAR(255),
    global_place_id VARCHAR(255),
    forecast VARCHAR(255),
    time_var VARCHAR(255)
)
