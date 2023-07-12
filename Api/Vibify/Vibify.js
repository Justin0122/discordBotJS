const request = require('request');
let defaultAmount = 5;
class Spotify {
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
        const link = this.apiUrl + '/me?secure_token=' + SecureToken;
        if (await this.makeRequest(link) === undefined) {
            return 'Invalid token.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getCurrentlyPlaying(SecureToken) {
        const link = this.apiUrl + '/current?secure_token=' + SecureToken;
        if (await this.makeRequest(link) === undefined) {

        }
        else{
            return await this.makeRequest(link);
        }
    }

    async getTopTracks(SecureToken, amount = defaultAmount, offset = 0) {
        const link = this.apiUrl + '/tracks/top?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset;
        if (await this.makeRequest(link) === undefined) {
            return 'No top tracks.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getTopArtists(SecureToken, amount = defaultAmount = 5, offset = 0) {
        const link = this.apiUrl + '/artists/top?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset;
        if (await this.makeRequest(link) === undefined) {
            return 'No top artists.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getLikedSongs(SecureToken, amount = defaultAmount) {
        const link = this.apiUrl + '/tracks/liked?secure_token=' + SecureToken + '&amount=' + amount;
        if (await this.makeRequest(link) === undefined) {
            return 'No liked songs.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getRecentlyPlayed(SecureToken, amount = defaultAmount) {
        const link = this.apiUrl + '/tracks/recent?secure_token=' + SecureToken + '&amount=' + amount;
        if (await this.makeRequest(link) === undefined) {
            return 'No recently played songs.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getNewReleases(SecureToken, amount = defaultAmount, offset = 0, country = 'US') {
        const link = this.apiUrl + '/albums/new?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset + '&country=' + country;
        if (await this.makeRequest(link) === undefined) {
            return 'No new releases.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getLikedAlbums(SecureToken, amount = defaultAmount, offset = 0) {
        const link = this.apiUrl + '/albums/liked?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset;
        if (await this.makeRequest(link) === undefined) {
            return 'No liked albums.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getLikedArtists(SecureToken, amount = defaultAmount, offset) {
        const link = this.apiUrl + '/artists/liked?secure_token=' + SecureToken + '&amount=' + amount + '&offset=' + offset;
        if (await this.makeRequest(link) === undefined) {
            return 'No liked artists.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async createPlaylist(playlistName, month, year) {
        const link = this.apiUrl + '/playlist?secure_token=' + this.secureToken + '&month=' + month + '&year=' + year;
        if (await this.makeRequest(link) === undefined) {
            return 'Failed to create playlist.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getArtistTopTracks(SecureToken, artistId, amount = defaultAmount) {
        const link = this.apiUrl + '/artists/top/tracks?secure_token=' + SecureToken + '&artist_id=' + artistId + '&amount=' + amount;
        if (await this.makeRequest(link) === undefined) {
            return 'No top tracks.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async getLikedPlaylists(SecureToken, userId, amount = defaultAmount) {
        const link = this.apiUrl + '/playlists/liked?secure_token=' + SecureToken + '&user_id=' + userId + '&amount=' + amount;
        if (await this.makeRequest(link) === undefined) {
            return 'No liked playlists.';
        }
        else {
            return await this.makeRequest(link);
        }
    }

    async createRecommendationPlaylist(SecureToken) {
        const link = this.apiUrl + '/recommendations?secure_token=' + SecureToken;
        if (await this.makeRequest(link) === undefined) {
            return 'Failed to create playlist.';
        }
        else {
            return await this.makeRequest(link);
        }
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

module.exports = Spotify;
