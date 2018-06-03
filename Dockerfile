FROM node:carbon

# Create app directory
WORKDIR /urs/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

COPY ./build .

EXPOSE 8000

CMD [ "npm", "start" ]