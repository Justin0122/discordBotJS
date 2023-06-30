module.exports = (client) => {
    //get all words from the database from tbl_words
    con.query("SELECT * FROM tbl_words", function (err, result, fields) {
        if (err) throw err;
        //loop through the results
        result.forEach(word => {
            //add the word to the array
            words.push(word.word);
        });
    } );

}
