CREATE TABLE IF NOT EXISTS venues (
    id TEXT PRIMARY KEY,
    name TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    zip TEXT,
    address TEXT,
    capacity INTEGER,
    surface TEXT,
    roof_type TEXT,
    lat REAL,
    lng REAL
);

CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    scheduled TEXT,
    home_team_id TEXT,
    away_team_id TEXT,
    home_points INTEGER,
    away_points INTEGER,
    venue_id TEXT,
    broadcast_network TEXT,
    time_zone TEXT,
    weather_condition TEXT,
    weather_humidity INTEGER,
    weather_temp INTEGER,
    weather_wind_speed INTEGER,
    weather_wind_direction TEXT,
    FOREIGN KEY(home_team_id) REFERENCES teams(id),
    FOREIGN KEY(away_team_id) REFERENCES teams(id),
    FOREIGN KEY(venue_id) REFERENCES venues(id)
);

CREATE TABLE IF NOT EXISTS periods (
    id TEXT PRIMARY KEY,
    game_id TEXT,
    period_number INTEGER,
    home_points INTEGER,
    away_points INTEGER,
    FOREIGN KEY(game_id) REFERENCES games(id)
);

CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    team_id TEXT,
    name TEXT,
    position TEXT,
    weight REAL,
    height INTEGER,
    birth_date TEXT,
    college TEXT,
    college_conf TEXT,
    rookie_year INTEGER,
    status TEXT,
    sr_id TEXT,
    experience INTEGER,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT,
    market TEXT,
    alias TEXT,
    sr_id TEXT,
);
