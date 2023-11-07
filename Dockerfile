FROM node:latest

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm production packages
RUN npm install --production

COPY . /opt/app-root/src

ENV NODE_ENV production
ENV PORT 5000

EXPOSE 5000

CMD ["npm", "start"]
