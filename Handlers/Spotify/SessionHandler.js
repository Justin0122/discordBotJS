const SpotifyWebApi = require('spotify-web-api-node');
const request = require('request');

class SessionHandler {
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
            const topTracks = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyTopTracks());
            return topTracks.body;
        } catch (error) {
            throw new Error('Failed to retrieve Spotify user.');
        }
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

    async getTopArtists(id) {
        try {
            const topArtists = await this.makeSpotifyApiCall(() => this.spotifyApi.getMyTopArtists());
            return topArtists.body;
        } catch (error) {
            throw new Error('Failed to retrieve Spotify user.');
        }
    }
}

module.exports = SessionHandler;
