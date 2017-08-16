var config = require('./config.js');
var Twit = require('twit');

var Bot = new Twit({
    consumer_key: config.TWITTER_CONSUMER_KEY,
    consumer_secret: config.TWITTER_CONSUMER_SECRET,
    access_token: config.TWITTER_ACCESS_TOKEN,
    access_token_secret: config.TWITTER_ACCESS_TOKEN_SECRET
});

console.log('The bot is running...');

function searchTweets(query) {
    console.log('The bot is searching tweets...');
    return Bot.get('search/tweets', query);
}

var reTweetedCount = 0,
    idsSavedCount = 0,
    reTweetedIds = {};

function reTweetAll(tweets) {
    if (tweets) {
        var length = tweets.length;
        console.log('bot found ' + length + ' tweets');
        for (var i = 0; i < length; i++) {
            if (tweets[i]) {
                var tweet = tweets[i],
                    id = tweet.id_str;
                if (tweet && !reTweetedIds[id]) {
                    (function (id) {
                        Bot.post('statuses/retweet/:id', {id: id}, function (err, data, response) {
                            if (err) {
                                console.log('Bot could not retweet, : ' + err);
                                if (err.code === 327) {
                                    reTweetedIds[id] = id;
                                }
                            }
                            else {
                                reTweetedCount++;
                                console.log(reTweetedCount + '# Bot retweeted: ' + id);
                                reTweetedIds[id] = id;
                                idsSavedCount++;
                                if (idsSavedCount === config.RETWEET_SAVE_LIMIT) {
                                    idsSavedCount = 0;
                                    reTweetedIds = {};
                                }
                            }
                        });

                    })(id);
                }
            }
        }
    }
}

function BotRetweet() {
    searchTweets(config.RETWEET_SEARCH_QUERY)
        .catch(function (err) {
            console.log('Bot could not find latest tweets, : ' + err);
        })
        .then(function (result) {
            reTweetAll(result.data.statuses);
            console.log('Bot scheduled ' + config.RETWEET_MINUTES_INTERVAL + ' minutes...');
            setInterval(BotRetweet, config.RETWEET_MINUTES_INTERVAL * 60 * 1000);
        });
}

BotRetweet();