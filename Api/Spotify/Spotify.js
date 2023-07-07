const SpotifyWebApi = require('spotify-web-api-node');
const request = require('request');

const max = 25;

class Spotify {
    constructor(secureToken, apiUrl, redirectUri, clientId, clientSecret) {
        this.secureToken = secureToken;
        this.apiUrl = apiUrl;
        this.redirectUri = redirectUri;
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        this.spotifyApi = new SpotifyWebApi({
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            redirectUri: this.redirectUri,
        });
    }

    async makeSpotifyApiCall(apiCall) {
        try {
            return await apiCall();
        } catch (error) {
            if (error.statusCode === 401) {
                await this.handleTokenRefresh();
                return await apiCall();
            }
            throw error;
        }
    }

    async getUser(discordId) {
        const link = `${this.apiUrl}?discord_id=${discordId}&secure_token=${this.secureToken}`;
        const options = {
            url: link,
            headers: {
                'User-Agent': 'request',
            },
        };

        return new Promise((resolve, reject) => {
            request.get(options, async (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    const json = JSON.parse(body);
                    const user = json.data.find((data) => data.attributes.discord_id === discordId);
                    try{
                    this.setSpotifyTokens(user.attributes.spotify_access_token, user.attributes.spotify_refresh_token);
                    } catch (error) {
                        reject(new Error('You have not authorized the application. Please authorize it using `/spotify auth`.'));
                    }

                    try {
                        const me = await this.spotifyApi.getMe();
                        resolve(me.body);
                    } catch (error) {
                        try{
                        await this.handleTokenRefresh(user.attributes.spotify_refresh_token);
                        } catch (error) {
                            return;
                        }
                        try {
                            const refreshedMe = await this.spotifyApi.getMe();
                            resolve(refreshedMe.body);
                        } catch (error) {
                            reject(new Error('Failed to retrieve Spotify user after refreshing token.'));
                        }
                    }
                }
            });
        });
    }

    async handleTokenRefresh(refreshToken) {
        try {
            const refreshedTokens = await this.refreshAccessToken(refreshToken);
            this.setSpotifyTokens(refreshedTokens.access_token, refreshedTokens.refresh_token);
        } catch (error) {
            throw new Error('Failed to refresh Spotify access token.');
        }
    }

    async refreshAccessToken(refreshToken) {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                Authorization: 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64'),
            },
            form: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            },
            json: true,
        };

        return new Promise((resolve, reject) => {
            request.post(authOptions, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    const { access_token, refresh_token } = body;
                    resolve({
                        access_token: access_token,
                        refresh_token: refresh_token || refreshToken,
                    });
                } else {
                    reject(error);
                }
            });
        });
    }

    setSpotifyTokens(accessToken, refreshToken) {
        this.spotifyApi.setAccessToken(accessToken);
        this.spotifyApi.setRefreshToken(refreshToken);
    }

    async getCurrentlyPlaying() {
        try {
            const currentlyPlaying = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyCurrentPlayingTrack());
            return currentlyPlaying.body;
        } catch (error) {
            throw new Error('Failed to retrieve Spotify user.');
        }
    }

    async getTopTracks(amount = max) {
        try {
            const topTracks = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyTopTracks({ limit: amount }));
            return topTracks.body;
        } catch (error) {
            throw new Error('Failed to retrieve Spotify user.');
        }
    }

    async getTopArtists() {
        try {
            const topArtists = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyTopArtists({ limit: 5 }));
            return topArtists.body;
        } catch (error) {
            throw new Error('Failed to retrieve Spotify user.');
        }
    }

    async createPlaylist(playlistName, month, year) {
        try {
            const songsFromMonth = await this.findLikedFromMonth(month, year);
            const playlistDescription = `This playlist is generated with your liked songs from ${month}/${year}.`;
            if (songsFromMonth.length === 0) {
                return;
            }
            const playlist = await this.makeSpotifyApiCall(() =>
                this.spotifyApi.createPlaylist(playlistName, {
                    description: playlistDescription,
                    public: false,
                    collaborative: false,
                })
            );
            const songUris = songsFromMonth.map((song) => song.track.uri);
            for (let i = 0; i < songUris.length; i += max) {
                const uris = songUris.slice(i, i + max);
                await this.makeSpotifyApiCall(() => this.spotifyApi.addTracksToPlaylist(playlist.body.id, uris));
            }
            //get the playlist with the tracks added
            const playlistWithTracks = await this.makeSpotifyApiCall(() => this.spotifyApi.getPlaylist(playlist.body.id));
            return playlistWithTracks.body;
        } catch (error) {
            throw new Error('Failed to create playlist.');
        }
    }

    async findLikedFromMonth(month, year) {
        let likedSongs = [];
        let offset = 0;
        let limit = max;
        let total = 1;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        while (likedSongs.length < total) {
            const response = await this.makeSpotifyApiCall(() =>
                this.spotifyApi.getMySavedTracks({ limit: limit, offset: offset })
            );
            const songs = response.body.items;
            total = response.body.total;
            offset += limit;

            const addedAt = new Date(songs[0].added_at);
            if (addedAt < startDate || (addedAt > endDate && likedSongs.length > 0)) {
                break;
            }

            likedSongs = likedSongs.concat(
                songs.filter((song) => {
                    const addedAt = new Date(song.added_at);
                    return addedAt >= startDate && addedAt <= endDate;
                })
            );
        }
        return likedSongs;
    }

    async getLikedSongs(total = max) {
        try {
            const likedSongs = await this.makeSpotifyApiCall(() => this.spotifyApi.getMySavedTracks({ limit: total }));
            return likedSongs.body;
        } catch (error) {
            throw new Error('Failed to retrieve liked songs.');
        }
    }

    async getAudioFeatures(tracksIds) {
        const limit = 100;
        let offset = 0;
        const total = tracksIds.length;
        let audioFeatures = [];

        while (audioFeatures.length < total) {
            const response = await this.makeSpotifyApiCall(() =>
                this.spotifyApi.getAudioFeaturesForTracks(tracksIds.slice(offset, offset + limit))
            );
            audioFeatures = audioFeatures.concat(response.body.audio_features);
            offset += limit;
        }

        return audioFeatures;
    }

    async createRecommendationPlaylist(trackIds){
        const audioFeatures = await this.getAudioFeatures(trackIds);
        const lowestDanceability = Math.min(...audioFeatures.map((track) => track.danceability));
        const highestDanceability = Math.max(...audioFeatures.map((track) => track.danceability));
        const lowestEnergy = Math.min(...audioFeatures.map((track) => track.energy));
        const highestEnergy = Math.max(...audioFeatures.map((track) => track.energy));
        const lowestLoudness = Math.min(...audioFeatures.map((track) => track.loudness));
        const highestLoudness = Math.max(...audioFeatures.map((track) => track.loudness));
        const lowestSpeechiness = Math.min(...audioFeatures.map((track) => track.speechiness));
        const highestSpeechiness = Math.max(...audioFeatures.map((track) => track.speechiness));
        const lowestAcousticness = Math.min(...audioFeatures.map((track) => track.acousticness));
        const highestAcousticness = Math.max(...audioFeatures.map((track) => track.acousticness));
        const lowestInstrumentalness = Math.min(...audioFeatures.map((track) => track.instrumentalness));
        const highestInstrumentalness = Math.max(...audioFeatures.map((track) => track.instrumentalness));
        const lowestLiveness = Math.min(...audioFeatures.map((track) => track.liveness));
        const highestLiveness = Math.max(...audioFeatures.map((track) => track.liveness));
        const lowestValence = Math.min(...audioFeatures.map((track) => track.valence));
        const highestValence = Math.max(...audioFeatures.map((track) => track.valence));
        const lowestTempo = Math.min(...audioFeatures.map((track) => track.tempo));
        const highestTempo = Math.max(...audioFeatures.map((track) => track.tempo));

        const randomTrackIds = [];
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * trackIds.length);
            randomTrackIds.push(trackIds[randomIndex]);
        }
        const genre = await this.getTopGenre(2);


        const recommendations = await this.makeSpotifyApiCall(() => this.spotifyApi.getRecommendations({
            seed_tracks: randomTrackIds,
            seed_genres: genre,
            limit: 50,
            min_danceability: lowestDanceability,
            max_danceability: highestDanceability,
            min_energy: lowestEnergy,
            max_energy: highestEnergy,
            min_loudness: lowestLoudness,
            max_loudness: highestLoudness,
            min_speechiness: lowestSpeechiness,
            max_speechiness: highestSpeechiness,
            min_acousticness: lowestAcousticness,
            max_acousticness: highestAcousticness,
            min_instrumentalness: lowestInstrumentalness,
            max_instrumentalness: highestInstrumentalness,
            min_liveness: lowestLiveness,
            max_liveness: highestLiveness,
            min_valence: lowestValence,
            max_valence: highestValence,
            min_tempo: lowestTempo,
            max_tempo: highestTempo,
        }));
        const genreString = genre.join(', ');

        const playlist = await this.makeSpotifyApiCall(() => this.spotifyApi.createPlaylist('Recommendations', {
            description: 'Genres: ' + genreString,
            public: false,
            collaborative: false,
        }));

        const songUris = recommendations.body.tracks.map((song) => song.uri);
        for (let i = 0; i < songUris.length; i += max) {
            const uris = songUris.slice(i, i + max);
            await this.makeSpotifyApiCall(() => this.spotifyApi.addTracksToPlaylist(playlist.body.id, uris));
        }

        const playlistWithTracks = await this.makeSpotifyApiCall(() => this.spotifyApi.getPlaylist(playlist.body.id));
        return playlistWithTracks.body;
    }

    async getTopGenre(amount) {
        const topArtists = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyTopArtists({ limit: 5 }));
        const topArtistsGenres = topArtists.body.items.map((artist) => artist.genres);
        const topArtistsGenresFlat = [].concat.apply([], topArtistsGenres);
        const topArtistsGenresCount = topArtistsGenresFlat.reduce((acc, genre) => {
            if (acc[genre]) {
                acc[genre]++;
            } else {
                acc[genre] = 1;
            }
            return acc;
        }, {});
        const topArtistsGenresSorted = Object.keys(topArtistsGenresCount).sort((a, b) => topArtistsGenresCount[b] - topArtistsGenresCount[a]);
        return topArtistsGenresSorted.slice(0, amount);
    }

    async logout(id) {
        const url = `${this.apiUrl}?discord_id=${id}&secure_token=${this.secureToken}&logout=true`;
        await fetch(url);
    }
}

module.exports = Spotify;
