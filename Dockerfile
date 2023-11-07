FROM ghcr.io/puppeteer/puppeteer:latest

# Copy package.json and package-lock.json
COPY --chown=pptruser:pptruser package.json ./

# Install npm production packages
RUN npm install

COPY . .

ENV NODE_ENV production

ENTRYPOINT ["npm", "start"]
