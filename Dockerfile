FROM ghcr.io/puppeteer/puppeteer:latest

# Copy package.json and package-lock.json
COPY --chown=pptruser:pptruser package.json ./

# Install npm production packages
RUN npm install

COPY . .

ENV NODE_ENV production
ENV PORT 5000

EXPOSE 5000

ENTRYPOINT ["npm", "start"]
