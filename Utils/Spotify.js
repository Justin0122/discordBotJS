async function audioFeatures(spotifySession, playlist, interaction) {
    const audioFeatures = await spotifySession.getAudioFeatures(playlist.id, interaction.user.id);

    return `**Danceability**: ${((audioFeatures.map(a => a.danceability).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
        `**Energy**: ${((audioFeatures.map(a => a.energy).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
        `**Loudness**: ${(audioFeatures.map(a => a.loudness).reduce((a, b) => a + b, 0) / audioFeatures.length).toFixed(2)} dB\n` +
        `**Speechiness**: ${((audioFeatures.map(a => a.speechiness).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
        `**Acousticness**: ${((audioFeatures.map(a => a.acousticness).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
        `**Instrumentalness**: ${((audioFeatures.map(a => a.instrumentalness).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
        `**Liveness**: ${((audioFeatures.map(a => a.liveness).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
        `**Valence**: ${((audioFeatures.map(a => a.valence).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
        `**Tempo**: ${(audioFeatures.map(a => a.tempo).reduce((a, b) => a + b, 0) / audioFeatures.length).toFixed(2)} BPM\n`;
}

module.exports = {
    audioFeatures
}