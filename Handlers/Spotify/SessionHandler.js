const SpotifyWebApi = require('spotify-web-api-node');

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

    async getTokens(userId) {
        const url = `${this.apiUrl}${userId}?secure_token=${this.secureToken}&discord_id=${userId}`;
        try {
            const response = await fetch(url);
            const json = await response.json();

            const { spotify_access_token, spotify_refresh_token } = json.data.attributes;
            return {
                access_token: spotify_access_token,
                refresh_token: spotify_refresh_token
            };
        } catch (error) {
            throw new Error('Failed to retrieve Spotify tokens.');
        }
    }

    async refreshAccessToken(userId) {
        const data = await this.spotifyApi.clientCredentialsGrant();
        this.spotifyApi.setAccessToken(data.body['access_token']);
    }

    async getUser(userId) {
        let tokens = await this.getTokens(userId);

        this.spotifyApi.setAccessToken(tokens.access_token);
        this.spotifyApi.setRefreshToken(tokens.refresh_token);

        try {
            const user = await this.spotifyApi.getMe();
            return user.body;
        } catch (error) {
            tokens = await this.getTokens(userId);
            await this.refreshAccessToken(userId);
            const refreshedUser = await this.spotifyApi.getMe();
            return refreshedUser.body;
        }
    }
}

module.exports = SessionHandler;
