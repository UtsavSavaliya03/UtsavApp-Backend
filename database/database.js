require('dotenv').config();
const mongoose = require('mongoose');

function DatabaseConnection(retries = 5, delay = 2000) {

    return new Promise((resolve, reject) => {
        const connectWithRetry = (attempt) => {
            console.log(`Attempt ${attempt}: Connecting to MongoDB...`);
            mongoose.connect(process.env.DATABASE_CON_URI)
            .then(() => {
                console.log('MongoDB connected successfully!');
                resolve(); // Resolve the promise when connected
            })
            .catch((error) => {
                console.error(`Error while connecting to MongoDB (Attempt ${attempt}):`, error);

                if (attempt < retries) {
                    console.log(`Retrying to connect to database in ${delay / 1000} seconds...`);
                    setTimeout(() => connectWithRetry(attempt + 1), delay);
                } else {
                    console.error('Failed to connect to MongoDB after maximum retries.');
                    reject(error); // Reject the promise on final failure
                }
            });
        };

        connectWithRetry(1); // Start with the first attempt
    });
}

module.exports = DatabaseConnection;