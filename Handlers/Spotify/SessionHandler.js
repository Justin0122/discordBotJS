const SpotifyWebApi = require('spotify-web-api-node');
const { promisify } = require('util');

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

        this.initialize();
    }

    async initialize() {
        const clientCredentialsGrantAsync = promisify(this.spotifyApi.clientCredentialsGrant.bind(this.spotifyApi));

        try {
            const result = await clientCredentialsGrantAsync();
            console.log('The access token expires in ' + result.body['expires_in']);
            console.log('The access token is ' + result.body['access_token']);

            this.spotifyApi.setAccessToken(result.body['access_token']);
        } catch (error) {
            console.log('Error occurred during token initialization:', error);
        }
    }

    async getTokens(userId) {
        try {
            const response = await fetch(`${this.apiUrl}${userId}?secure_token=${this.secureToken}&discord_id=${userId}`);
            const json = await response.json();

            const { spotify_access_token, spotify_refresh_token } = json.data.attributes;
            return {
                access_token: spotify_access_token,
                refresh_token: spotify_refresh_token,
            };
        } catch (error) {
            console.error('Failed to retrieve Spotify tokens:', error);
            return null;
        }
    }

    async getUser(userId) {
        let tokens = await this.getTokens(userId);

        this.spotifyApi.setAccessToken(tokens.access_token);
        this.spotifyApi.setRefreshToken(tokens.refresh_token);

        try {
            const user = await this.spotifyApi.getMe();
            return user.body;
        } catch (error) {
            if (error.statusCode === 401) {
                // Access token expired, refresh the token
                const refreshedTokens = await this.refreshAccessToken(userId, tokens.refresh_token);
                if (refreshedTokens) {
                    console.log('Access token expired, refreshed token.');

                    // Set the new access token
                    this.spotifyApi.setAccessToken(refreshedTokens.access_token);

                    // Retry getting the user
                    try {
                        const refreshedUser = await this.spotifyApi.getMe();
                        return refreshedUser.body;
                    } catch (error) {
                        console.error('Failed to retrieve Spotify user after refreshing access token:', error);
                        return null;
                    }
                }
            }
            throw new Error('Failed to retrieve Spotify user.');
        }
    }

    async refreshAccessToken(userId, refreshToken) {
        const link = `${this.apiUrl}?discord_id=${userId}&secure_token=${this.secureToken}&spotify_refresh_token=${refreshToken}`;

        try {
            const response = await fetch(link);
            const json = await response.json();
            console.log('Refreshed access token:', json);

            if (!json.data || !json.data[0].attributes.spotify_access_token) {
                return null;
            }
            //find the new access token of the user where discord_id = discord_id
            const firstData = json.data.find((data) => data.attributes.discord_id === userId);
            console.log('firstData:', firstData);

            return {
                access_token: firstData.attributes.spotify_access_token,
                refresh_token: firstData.attributes.spotify_refresh_token,
            }
        } catch (error) {
            console.error('Failed to refresh access token:', error);
            return null;
        }
    }
}

module.exports = SessionHandler;
