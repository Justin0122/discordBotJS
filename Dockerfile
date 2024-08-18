FROM node:20
RUN apt-get update && apt-get install -y sqlite3
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .

# Start the bot
CMD ["node", "index.js"]
