const request = require('request');
let defaultAmount = 5;
class Vibify {
    constructor(UserToken) {
        this.secureToken = UserToken;
        this.apiUrl = process.env.VIBIFY_API_URL || process.env.DEV_API_URL;
        this.header = {
            Authorization: 'Bearer ' + this.secureToken,
        };
    }

    async makeRequest(url) {
        return new Promise((resolve, reject) => {
            request({ url, headers: this.header, json: true }, (error, response, body) => {
                if (error) {
                    reject(error);
                } else if (response.statusCode !== 200) {
                    reject(new Error(`Request failed with status code ${response.statusCode}`));
                } else {
                    resolve(body);
                }
            });
        });
    }

    async getUser(SecureToken) {
        return await this.makeRequest(this.apiUrl + '/me?secure_token=' + SecureToken);
    }

    async getCurrentlyPlaying(SecureToken) {
        return await this.makeRequest(this.apiUrl + '/current?secure_token=' + SecureToken);
    }

    async getTopTracks(SecureToken, amount = defaultAmount, offset = 0) {
        return await this.makeRequest(this.apiUrl + '/tracks/top?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset);
    }

    async getTopArtists(SecureToken, amount = defaultAmount = 5, offset = 0) {
        return await this.makeRequest(this.apiUrl + '/artists/top?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset);
    }

    async getLikedSongs(SecureToken, amount = defaultAmount) {
        return await this.makeRequest(this.apiUrl + '/tracks/liked?secure_token=' + SecureToken + '&amount=' + amount);
    }

    async getRecentlyPlayed(SecureToken, amount = defaultAmount) {
        return await this.makeRequest(this.apiUrl + '/tracks/recent?secure_token=' + SecureToken + '&amount=' + amount);
    }

    async getNewReleases(SecureToken, amount = defaultAmount, offset = 0, country = 'US') {
        return await this.makeRequest(this.apiUrl + '/albums/new?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset + '&country=' + country);
    }

    async getLikedAlbums(SecureToken, amount = defaultAmount, offset = 0) {
        return await this.makeRequest(this.apiUrl + '/albums/liked?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset);
    }

    async getLikedArtists(SecureToken, amount = defaultAmount, offset) {
        return await this.makeRequest(this.apiUrl + '/artists/liked?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset);
    }

    async createPlaylist(playlistName, month, year) {
        return await this.makeRequest(this.apiUrl + '/playlist?secure_token=' + this.secureToken + '&month=' + month + '&year=' + year);
    }

    async getArtistTopTracks(SecureToken, artistId, amount = defaultAmount) {
        return await this.makeRequest(this.apiUrl + '/artists/top/tracks?secure_token=' + SecureToken + '&artist_id=' + artistId + '&amount=' + amount);
    }

    async getLikedPlaylists(SecureToken, userId, amount = defaultAmount) {
        return await this.makeRequest(this.apiUrl + '/playlists/liked?secure_token=' + SecureToken + '&user_id=' + userId + '&amount=' + amount);
    }

    async createRecommendationPlaylist(SecureToken) {
        return await this.makeRequest(this.apiUrl + '/recommendations?secure_token=' + SecureToken);
    }

    async logout(id) {
        const url = `${this.apiUrl}/logout?discord_id=${id}&secure_token=${this.secureToken}&logout=true`;
        try {
            await this.makeRequest(url);

        } catch (error) {
            throw new Error('Failed to logout.');
        }

        return true;
    }
}

module.exports = Vibify;
