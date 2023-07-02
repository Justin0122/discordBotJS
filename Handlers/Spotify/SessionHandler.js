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
        // find the user with the discord id
        const user = json.data.find((data) => data.attributes.discord_id === discordId);

        // set the access token and refresh token
        this.spotifyApi.setAccessToken(user.attributes.spotify_access_token);
        this.spotifyApi.setRefreshToken(user.attributes.spotify_refresh_token);

        // get the "me" data
        try {
            const me = await this.spotifyApi.getMe();
            return me.body;
        } catch (error) {
            if (error.statusCode === 401) {
                const refreshedTokens = await this.refreshAccessToken(user.attributes.spotify_refresh_token);
                if (refreshedTokens) {

                    this.spotifyApi.setAccessToken(refreshedTokens.access_token);
                    this.spotifyApi.setRefreshToken(refreshedTokens.refresh_token);

                    // Retry getting the "me" data
                    try {
                        const refreshedMe = await this.spotifyApi.getMe();
                        return refreshedMe.body;
                    } catch (error) {
                        throw new Error('Failed to retrieve Spotify user after refreshing token.');
                    }
                }
            }
            throw new Error('Failed to retrieve Spotify user.');
        }
    }

    async refreshAccessToken(refreshToken) {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64'),
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
}

module.exports = SessionHandler;
