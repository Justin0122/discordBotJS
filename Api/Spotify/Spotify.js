const SpotifyWebApi = require('spotify-web-api-node');

const max = 25;

/**
 * Spotify class to handle all Spotify API calls
 * @class
 * @classdesc Class to handle all Spotify API calls
 */
class Spotify {
    /**
     * Create a Spotify object
     * @param {string} apiUrl - The URL for the Spotify API
     */
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    /**
     * Make a Spotify API call and handle token refresh if necessary
     * @param {string} apiCall - The Spotify API call to make
     * @param {string} method - The method to use for the API call
     * @param {object} [body] - The body to send with the API call
     * @returns {Promise} - The response from the Spotify API
     * @throws {Error} - Failed to make Spotify API call
     */
    async makeSpotifyApiCall(apiCall, method = "GET", body = {}) {
        const headers = {
            'x-application-id': process.env.APPLICATION_ID,
        };
        const baseUrl = `${this.apiUrl}`;
        if (method === 'POST' || method === 'PUT') {
            headers['Content-Type'] = 'application/json';
        }
        if (method === 'POST') {
            return await fetch(baseUrl + apiCall, {
                method,
                headers,
                body: JSON.stringify(body)
            })
                .then(res => res.text())
                .then(text => {
                    return JSON.parse(text);
                });
        }
        return await fetch(baseUrl + apiCall, {headers}).then((res) => res.json());
    }

    /**
     * Get the user's Spotify information
     * @param {string} discordId - The user's Discord ID
     * @returns {Promise} - The user's Spotify information
     */
    async getUser(discordId) {
        const url = `/user/${discordId}`;
        return await this.makeSpotifyApiCall(url)
    }

    /**
     * Get the user's currently playing track
     * @param {string} discordId - The user's Discord ID
     * @returns {Promise} - The user's currently playing track
     * @throws {Error} - Failed to retrieve currently playing track
     */
    async getCurrentlyPlaying(discordId) {
        const url = `/currently-playing/${discordId}`;
        return await this.makeSpotifyApiCall(url);
    }

    /**
     * Get the user's top tracks
     * @param {string} discordId - The user's Discord ID
     * @param {number} [amount=25] - The amount of top tracks to retrieve. Default is the value of the constant 'max'.
     * @returns {Promise} - The user's top tracks
     * @throws {Error} - Failed to retrieve top tracks
     */
    async getTopTracks(discordId, amount = max) {
        const url = `/top-tracks/${discordId}?amount=${amount}`;
        return await this.makeSpotifyApiCall(url);
    }

    /**
     * Get the user's last listened tracks
     * @param {string} discordId - The user's Discord ID
     * @param {number} [amount=25] - The amount of last listened tracks to retrieve. Default is the value of the constant 'max'.
     * @returns {Promise} - The user's last listened tracks
     * @throws {Error} - Failed to retrieve last listened tracks
     */
    async getLastListenedTracks(discordId, amount = max) {
        const url = `/last-listened/${discordId}?amount=${amount}`;
        return await this.makeSpotifyApiCall(url);
    }

    /**
     * Get the user's top artists
     * @param {string} discordId - The user's Discord ID
     * @param {number} [amount=25] - The amount of top artists to retrieve. Default is the value of the constant 'max'.
     * @returns {Promise} - The user's top artists
     * @throws {Error} - Failed to retrieve top artists
     */
    async getTopArtists(discordId, amount = max) {
        const url = `/top-artists/${discordId}?amount=${amount}`;
        return await this.makeSpotifyApiCall(url);
    }

    /**
     * Get the user's top tracks
     * @param {string} discordId - The user's Discord ID
     * @param {string} playlistName - The name of the playlist to create
     * @param {number} month - The month to create the playlist for
     * @param {number} year - The year to create the playlist for
     * @returns {Promise} - The created playlist
     * @throws {Error} - Failed to create playlist
     */
    async createPlaylist(discordId, playlistName, month, year) {
        const url = `/create-playlist`;
        return await this.makeSpotifyApiCall(url, 'POST', {
            id: discordId,
            month: month,
            year: year,
            playlistName: playlistName
        });
    }

    /**
     * Get the audio features for a playlist
     * @param {string} playlistId - The ID of the playlist
     * @param {string} discordId - The user's Discord ID
     * @returns {Promise<void>}
     */
    async getAudioFeatures(playlistId, discordId) {
        const url = `/audio-features/${playlistId}/${discordId}`;
        return await this.makeSpotifyApiCall(url);
    }

    /**
     * Creates a recommendation playlist.
     * @param {string} discordId - The user's Discord ID.
     * @param {string} genre - The genre.
     * @param {boolean} recentlyPlayed - Whether to include recently played tracks.
     * @param {boolean} mostPlayed - Whether to include most played tracks.
     * @param {boolean} likedSongs - Whether to include liked songs.
     * @returns {Promise} - The created recommendation playlist.
     */
    async createRecommendationPlaylist(discordId, genre, recentlyPlayed, mostPlayed, likedSongs) {
        const url = `/recommendations`;
        return await this.makeSpotifyApiCall(url, 'POST', {
            id: discordId,
            genre: genre,
            recentlyPlayed: recentlyPlayed || false,
            mostPlayed: mostPlayed || true,
            likedSongs: likedSongs || true
        });
    }

    /**
     * Get the user's top genre
     * @param {string} discordId - The user's Discord ID
     * @param {number} amount - The amount of top genres to get.
     * @returns {Promise} - The user's top genres
     */
    async getTopGenres(discordId, amount) {
        const url = `/top-genres/${discordId}?amount=${amount}`;
        return await this.makeSpotifyApiCall(url);
    }

    async logout(id) {
        const url = `/delete-user/${id}`;
        return await this.makeSpotifyApiCall(url);
    }
}

module.exports = Spotify;
