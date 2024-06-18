const redis = require('redis')


const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || localhost,
    port: process.env.REDIS_PORT || 6379,
})

redisClient.on("connect", () => {
    console.log('redis connected sucessfuly')
})



module.exports = redisClient 