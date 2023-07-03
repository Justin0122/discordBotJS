const SpotifyWebApi = require('spotify-web-api-node');
const request = require('request');

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
                await this.handleTokenRefresh(id);
                return await apiCall();
            }
            throw error;
        }
    }

    async getUser(discordId) {
        const link = `${this.apiUrl}?discord_id=${discordId}&secure_token=${this.secureToken}`;
        const response = await fetch(link);
        const json = await response.json();
        const user = json.data.find((data) => data.attributes.discord_id === discordId);

        this.setSpotifyTokens(user.attributes.spotify_access_token, user.attributes.spotify_refresh_token);

        try {
            const me = await this.spotifyApi.getMe();
            return me.body;
        } catch (error) {
            await this.handleTokenRefresh(user.attributes.spotify_refresh_token);
            try {
                const refreshedMe = await this.spotifyApi.getMe();
                return refreshedMe.body;
            } catch (error) {
                throw new Error('Failed to retrieve Spotify user after refreshing token.');
            }
        }
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

    async getCurrentlyPlaying(id) {
        try {
            const currentlyPlaying = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyCurrentPlayingTrack());
            return currentlyPlaying.body;
        } catch (error) {
            throw new Error('Failed to retrieve Spotify user.');
        }
    }

    async getTopTracks(id) {
        try {
            const topTracks = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyTopTracks({ limit: 5 }));
            return topTracks.body;
        } catch (error) {
            throw new Error('Failed to retrieve Spotify user.');
        }
    }

    async getTopArtists(id) {
        try {
            const topArtists = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyTopArtists({ limit: 5 }));
            return topArtists.body;
        } catch (error) {
            throw new Error('Failed to retrieve Spotify user.');
        }
    }

    async createPlaylist(id, playlistName, month, year) {
        try {
            const songsFromMonth = await this.findLikedFromMonth(id, month, year);
            const playlistDescription = `This playlist is generated with your liked songs from ${month}/${year}.`;
            const playlist = await this.makeSpotifyApiCall(() =>
                this.spotifyApi.createPlaylist(playlistName, {
                    description: playlistDescription,
                    public: false,
                    collaborative: false
                })
            );
            const songUris = songsFromMonth.map((song) => song.track.uri);
            //add tracks to the playlist in batches of 50
            for (let i = 0; i < songUris.length; i += 50) {
                const uris = songUris.slice(i, i + 50);
                await this.makeSpotifyApiCall(() =>
                    this.spotifyApi.addTracksToPlaylist(playlist.body.id, uris)
                );
            }
            //get the playlist with the tracks added
            const playlistWithTracks = await this.makeSpotifyApiCall(() =>
                this.spotifyApi.getPlaylist(playlist.body.id)
            );
            return playlistWithTracks.body;
        } catch (error) {
            throw new Error('Failed to create playlist.');
        }
    }

    async findLikedFromMonth(id, month, year) {
        let likedSongs = [];
        let offset = 0;
        let limit = 50;
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
            )
        }
        return likedSongs;
    }

}

module.exports = Spotify;
