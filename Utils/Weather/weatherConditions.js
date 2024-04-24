const weatherConditions = {
    sunny: {
        color: '#ffff00',
        emoji: '🌞',
    },
    'patchy rain': {
        color: '#adfffc',
        emoji: '🌧️',
    },
    rain: {
        color: '#0000ff',
        emoji: '🌧️',
    },
    cloudy: {
        color: '#808080',
        emoji: '🌤',
    },
    overcast: {
        color: '#808080',
        emoji: '🌥',
    },
    snow: {
        color: '#ffffff',
        emoji: '❄️',
    },
    thunderstorm: {
        color: '#800080',
        emoji: '⛈️',
    },
    fog: {
        color: '#808080',
        emoji: '🌫️',
    },
    mist: {
        color: '#808080',
        emoji: '🌫️',
    },
    haze: {
        color: '#808080',
        emoji: '🌫️',
    },
    drizzle: {
        color: '#808080',
        emoji: '🌧️',
    },
    freezing: {
        color: '#ffffff',
        emoji: '❄️',
    },
    sleet: {
        color: '#ffffff',
        emoji: '❄️',
    },
};

const moonPhases = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘',
};

module.exports = {
    moonPhases: moonPhases,
    weatherConditions: weatherConditions
}