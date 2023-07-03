const request = require('request');

class SessionHandler {
    constructor(apiUrl, apiKey){
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
    }

    async getWeather(country, city = null) {
        let link = `${this.apiUrl}/current.json?key=${this.apiKey}&q=${city},${country}`;
        return new Promise((resolve, reject) => {
            request(link, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                resolve(JSON.parse(body));
            });
        });
    }

    async getForecast(country, city = null) {
        const link = `${this.apiUrl}/forecast.json?key=${this.apiKey}&q=${city},${country}&days=3&alerts=yes`;
        return new Promise((resolve, reject) => {
            request(link, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                resolve(JSON.parse(body));
            });
        });
    }
}

module.exports = SessionHandler;
